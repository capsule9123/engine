import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastify, { type FastifyInstance } from "fastify";
import * as fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";

import { clearCacheCron } from "../shared/utils/cron/clear-cache-cron";
import { env } from "../shared/utils/env";
import { logger } from "../shared/utils/logger";
import { metricsServer } from "../shared/utils/prometheus";
import { withServerUsageReporting } from "../shared/utils/usage";
import { withAdminRoutes } from "./middleware/admin-routes";
import { withAuth } from "./middleware/auth";
import { withCors } from "./middleware/cors";
import { withEnforceEngineMode } from "./middleware/engine-mode";
import { withErrorHandler } from "./middleware/error";
import { withRequestLogs } from "./middleware/logs";
import { withOpenApi } from "./middleware/open-api";
import { withPrometheus } from "./middleware/prometheus";
import { withRateLimit } from "./middleware/rate-limit";
import { withSecurityHeaders } from "./middleware/security-headers";
import { withWebSocket } from "./middleware/websocket";
import { withRoutes } from "./routes";
import { writeOpenApiToFile } from "./utils/openapi";

const SERVER_CONNECTION_TIMEOUT = 60_000;
const __dirname = new URL(".", import.meta.url).pathname;

interface HttpsObject {
  https: {
    key: Buffer;
    cert: Buffer;
    passphrase?: string;
  };
}

export const initServer = async () => {
  console.log("✅ Initializing Server...");

  let httpsObject: HttpsObject | undefined;
  if (env.ENABLE_HTTPS) {
    httpsObject = {
      https: {
        key: fs.readFileSync(path.join(__dirname, "../https/key.pem")),
        cert: fs.readFileSync(path.join(__dirname, "../https/cert.pem")),
        passphrase: env.HTTPS_PASSPHRASE,
      },
    };
  }

  const trustProxy = env.TRUST_PROXY || !!env.ENGINE_TIER;

  const server: FastifyInstance = fastify({
    maxParamLength: 200,
    connectionTimeout: SERVER_CONNECTION_TIMEOUT,
    disableRequestLogging: true,
    trustProxy,
    ...(env.ENABLE_HTTPS ? httpsObject : {}),
  }).withTypeProvider<TypeBoxTypeProvider>();

  withErrorHandler(server);
  withRequestLogs(server);
  withSecurityHeaders(server);
  withCors(server);
  withRateLimit(server);
  withEnforceEngineMode(server);
  withServerUsageReporting(server);
  withPrometheus(server);

  await withWebSocket(server);
  await withAuth(server);
  await withOpenApi(server);
  await withRoutes(server);
  await withAdminRoutes(server);

  console.log("✅ Fastify server ready, binding port...");

  await server.ready();

  const PORT = parseInt(process.env.PORT || "3000", 10);
  const HOST = "0.0.0.0";

  server.listen(
    { host: HOST, port: PORT },
    (err) => {
      if (err) {
        logger({
          service: "server",
          level: "fatal",
          message: "❌ Failed to start server",
          error: err,
        });
        process.exit(1);
      }
      console.log(`✅ Server is listening on http://${HOST}:${PORT}`);
    }
  );

  const publicUrl = `${env.ENABLE_HTTPS ? "https://" : "http://"}0.0.0.0:${PORT}`;
  logger({
    service: "server",
    level: "info",
    message: `Engine server running at: ${publicUrl}`,
  });

  writeOpenApiToFile(server);
  await clearCacheCron();
};
