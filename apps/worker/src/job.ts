import type { Logger } from "pino";

/**
 * The job pattern every worker job copies:
 *  1. an idempotency key built from the job data (core/idempotencyKey),
 *  2. "already done?" check first, so a retried or duplicated job does nothing,
 *  3. the handler re-reads current state before acting (a registration may have been cancelled since).
 */
export interface ProcessedStore {
  has(key: string): Promise<boolean>;
  add(key: string): Promise<void>;
}

export interface JobContext {
  correlationId: string;
  logger: Logger;
}

export interface JobDefinition<T> {
  name: string;
  key(data: T): string;
  handle(data: T, ctx: JobContext): Promise<void>;
}

export function defineJob<T>(definition: JobDefinition<T>): JobDefinition<T> {
  return definition;
}

export async function runJob<T>(job: JobDefinition<T>, data: T, deps: JobContext & { store: ProcessedStore }): Promise<"done" | "skipped"> {
  const key = job.key(data);
  if (await deps.store.has(key)) {
    deps.logger.info({ job: job.name, key, correlationId: deps.correlationId }, "job already done, skipped");
    return "skipped";
  }
  await job.handle(data, { correlationId: deps.correlationId, logger: deps.logger });
  await deps.store.add(key);
  return "done";
}

/** In-memory store for tests. The worker's real store is a database table (ticket T030). */
export class MemoryProcessedStore implements ProcessedStore {
  private readonly keys = new Set<string>();
  async has(key: string) {
    return this.keys.has(key);
  }
  async add(key: string) {
    this.keys.add(key);
  }
}
