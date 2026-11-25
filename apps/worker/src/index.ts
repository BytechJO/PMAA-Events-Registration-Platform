import { createLogger, loadEnv, newCorrelationId } from "@pmaa/core";
import { FakeMailSender } from "@pmaa/integrations";
import { PgBoss } from "pg-boss";
import { MemoryProcessedStore, runJob } from "./job";
import { confirmationEmailJob, type ConfirmationEmailData } from "./jobs/confirmation-email";

/*
 * Worker entry point. Registers each job on a pg-boss queue (stored in PostgreSQL).
 * Until T030 (outbox dispatcher) and T031 (Graph mail adapter) land, it uses the fake mail sender
 * and an in-memory "already done" store: good for local runs, not for production.
 */
const env = loadEnv();
const logger = createLogger();
const boss = new PgBoss(env.DATABASE_URL);
boss.on("error", (error) => logger.error({ err: error }, "pg-boss error"));

const store = new MemoryProcessedStore();
const confirmation = confirmationEmailJob(new FakeMailSender());

await boss.start();
await boss.createQueue(confirmation.name);
await boss.work<ConfirmationEmailData>(confirmation.name, async (jobs) => {
  for (const job of jobs) {
    await runJob(confirmation, job.data, { store, logger, correlationId: newCorrelationId() });
  }
});
logger.info({ queues: [confirmation.name] }, "worker started");

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    logger.info({ signal }, "worker stopping");
    await boss.stop();
    process.exit(0);
  });
}
