import "./polyfill";
import "./tracer";

import { initServer } from "./server";
import { env } from "./shared/utils/env";
import { logger } from "./shared/utils/logger";
import { initWorker } from "./worker";
import { CancelRecycledNoncesQueue } from "./worker/queues/cancel-recycled-nonces-queue";
import { MineTransactionQueue } from "./worker/queues/mine-transaction-queue";
import { NonceResyncQueue } from "./worker/queues/nonce-resync-queue";
import { ProcessEventsLogQueue } from "./worker/queues/process-event-logs-queue";
import { ProcessTransactionReceiptsQueue } from "./worker/queues/process-transaction-receipts-queue";
import { PruneTransactionsQueue } from "./worker/queues/prune-transactions-queue";
import { SendTransactionQueue } from "./worker/queues/send-transaction-queue";
import { SendWebhookQueue } from "./worker/queues/send-webhook-queue";

const main = async () => {
  if (env.ENGINE_MODE === "server_only") {
    await initServer();
  } else if (env.ENGINE_MODE === "worker_only") {
    await initWorker();
  } else {
    await initServer();
    await initWorker();
  }
};

main().catch((err) => {
  console.error("Failed to start server/worker:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger({ message: "Uncaught Exception", service: "server", level: "error", error: err });
});

process.on("unhandledRejection", (err) => {
  logger({ message: "Unhandled Rejection", service: "server", level: "error", error: err });
});

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

const gracefulShutdown = async (signal: NodeJS.Signals) => {
  logger({
    level: "info",
    service: "server",
    message: `Received ${signal}, closing server...`,
  });

  // Close BullMQ queues
  await SendWebhookQueue.q.close();
  await ProcessEventsLogQueue.q.close();
  await ProcessTransactionReceiptsQueue.q.close();
  await SendTransactionQueue.q.close();
  await MineTransactionQueue.q.close();
  await CancelRecycledNoncesQueue.q.close();
  await PruneTransactionsQueue.q.close();
  await NonceResyncQueue.q.close();

  process.exit(0);
};
