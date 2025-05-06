import { connectNodeAdapter } from "@connectrpc/connect-node";
import * as http2 from "http2";
import routes from "./handlers/centrifugo";

http2.createServer(connectNodeAdapter({ routes })).listen(9090, () => {
  console.log("Running GRPC server at :9090");
});
