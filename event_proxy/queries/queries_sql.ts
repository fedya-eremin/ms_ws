import { Sql } from "postgres";

export const getUserByIDQuery = `-- name: GetUserByID :one
SELECT "id", "username", "given_name", "family_name", "enabled"
FROM "public"."user"
WHERE "id"=$1`;

export interface GetUserByIDArgs {
    id: string;
}

export interface GetUserByIDRow {
    id: string;
    username: string;
    givenName: string;
    familyName: string;
    enabled: boolean;
}

export async function getUserByID(sql: Sql, args: GetUserByIDArgs): Promise<GetUserByIDRow | null> {
    const rows = await sql.unsafe(getUserByIDQuery, [args.id]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        id: row[0],
        username: row[1],
        givenName: row[2],
        familyName: row[3],
        enabled: row[4]
    };
}

export const createUserQuery = `-- name: CreateUser :exec
INSERT INTO "public"."user"
("id", "username", "given_name", "family_name", "enabled")
VALUES($1, $2, $3, $4, $5)`;

export interface CreateUserArgs {
    id: string;
    username: string;
    givenName: string;
    familyName: string;
    enabled: boolean;
}

export async function createUser(sql: Sql, args: CreateUserArgs): Promise<void> {
    await sql.unsafe(createUserQuery, [args.id, args.username, args.givenName, args.familyName, args.enabled]);
}

export const chanListByUserIDQuery = `-- name: ChanListByUserID :many
SELECT "channel"."id", "channel"."channel", "channel"."title", "channel"."default"
FROM "public"."channel"
JOIN "public"."user_channel" ON "user_channel"."chan_id" = "channel"."id"
WHERE "user_channel"."user_id"=$1`;

export interface ChanListByUserIDArgs {
    userId: string;
}

export interface ChanListByUserIDRow {
    id: string;
    channel: string;
    title: string;
    default: boolean;
}

export async function chanListByUserID(sql: Sql, args: ChanListByUserIDArgs): Promise<ChanListByUserIDRow[]> {
    return (await sql.unsafe(chanListByUserIDQuery, [args.userId]).values()).map(row => ({
        id: row[0],
        channel: row[1],
        title: row[2],
        default: row[3]
    }));
}

export const userListByChanIDQuery = `-- name: UserListByChanID :many
SELECT "user"."id", "user"."username", "user"."given_name", "user"."family_name", "user"."enabled"
FROM "public"."user"
JOIN "public"."user_channel" ON "user_channel"."user_id" = "user"."id"
WHERE "user_channel"."chan_id"=$1`;

export interface UserListByChanIDArgs {
    chanId: string;
}

export interface UserListByChanIDRow {
    id: string;
    username: string;
    givenName: string;
    familyName: string;
    enabled: boolean;
}

export async function userListByChanID(sql: Sql, args: UserListByChanIDArgs): Promise<UserListByChanIDRow[]> {
    return (await sql.unsafe(userListByChanIDQuery, [args.chanId]).values()).map(row => ({
        id: row[0],
        username: row[1],
        givenName: row[2],
        familyName: row[3],
        enabled: row[4]
    }));
}

export const userCanPublishQuery = `-- name: UserCanPublish :one
SELECT EXISTS (
    SELECT 1 
    FROM public.user_channel uc
    JOIN public.channel c ON uc.chan_id = c.id
    WHERE uc.user_id = $1 AND c.channel = $2 AND uc.can_publish = true
)`;

export interface UserCanPublishArgs {
    userId: string;
    channel: string;
}

export interface UserCanPublishRow {
    exists: boolean;
}

export async function userCanPublish(sql: Sql, args: UserCanPublishArgs): Promise<UserCanPublishRow | null> {
    const rows = await sql.unsafe(userCanPublishQuery, [args.userId, args.channel]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        exists: row[0]
    };
}

