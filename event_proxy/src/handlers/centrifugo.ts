import { ConnectRouter } from "@connectrpc/connect";
import {
  CentrifugoProxy,
  PublishRequest,
  PublishResponse,
  SubscribeRequest,
  SubscribeResponse,
  Error,
} from "@/gen/proto/proxyproto_pb";
import * as sql from "@/gen/sql/queries_sql";
import db from "@/storage/db";
import KeycloakAdminClient from "@keycloak/keycloak-admin-client";

async function getOrCreateUser(userId: string): Promise<sql.GetUserByIDRow> {
  let dbUser = await sql.getUserByID(db, { id: userId });
  if (dbUser) return dbUser;

  const keycloakAdmin = new KeycloakAdminClient({
    baseUrl: process.env.KEYCLOAK_SERVER_URL!,
    realmName: process.env.KEYCLOAK_REALM!,
  });

  await keycloakAdmin.auth({
    clientId: process.env.KEYCLOAK_CLIENT_ID!,
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
    username: process.env.KEYCLOAK_ADMIN_USER!,
    password: process.env.KEYCLOAK_ADMIN_PASSWORD!,
    grantType: "password",
  });

  const kcUser = await keycloakAdmin.users.findOne({ id: userId });
  if (!kcUser) throw new Error("User not found in Keycloak");

  await sql.createUser(db, {
    id: userId,
    username: kcUser.username!,
    givenName: kcUser.firstName || "",
    familyName: kcUser.lastName || "",
    enabled: kcUser.enabled || false,
  });

  dbUser = await sql.getUserByID(db, { id: userId });
  if (!dbUser) throw new Error("Failed to create user in database");
  return dbUser;
}

async function checkPublishPermission(
  userId: string,
  channel: string,
): Promise<boolean> {
  try {
    const user = await getOrCreateUser(userId);
    if (!user.enabled) return false;

    return (
      (
        await sql.userCanPublish(db, {
          userId: user.id,
          channel: channel,
        })
      )?.exists || false
    );
  } catch (e) {
    console.error("Publish permission check failed:", e);
    return false;
  }
}
async function checkSubscriptionPermission(
  userId: string,
  channel: string,
): Promise<boolean> {
  try {
    const user = await getOrCreateUser(userId);
    if (!user.enabled) return false;

    const channels = await sql.chanListByUserID(db, { userId: user.id });
    return channels.some((c) => c.channel === channel);
  } catch (e) {
    console.error("Subscription permission check failed:", e);
    return false;
  }
}

export default (router: ConnectRouter) => {
  router.service(CentrifugoProxy, {
    async publish(request: PublishRequest): Promise<PublishResponse> {
      try {
        if (!(await checkPublishPermission(request.user, request.channel))) {
          return {
            error: {
              code: 403,
              message: "Publish forbidden",
              temporary: false,
            } as Error,
          } as PublishResponse;
        }
        return { result: {} } as PublishResponse;
      } catch (e: any) {
        return {
          error: { code: 500, message: e.message, temporary: true } as Error,
        } as PublishResponse;
      }
    },

    async subscribe(request: SubscribeRequest): Promise<SubscribeResponse> {
      try {
        if (
          !(await checkSubscriptionPermission(request.user, request.channel))
        ) {
          return {
            error: {
              code: 403,
              message: "Subscription forbidden",
              temporary: false,
            } as Error,
          } as SubscribeResponse;
        }
        return { result: {} } as SubscribeResponse;
      } catch (e: any) {
        return {
          error: { code: 500, message: e.message, temporary: true } as Error,
        } as SubscribeResponse;
      }
    },
  });
};
