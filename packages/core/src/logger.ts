import { randomUUID } from "node:crypto";
import pino, { type DestinationStream, type Logger } from "pino";

/** Fields that may hold personal data. They are never written to logs (spec §18). */
export const redactedPaths = [
  "email", "phone", "name", "firstName", "lastName", "fullName", "joinUrl", "token",
  "*.email", "*.phone", "*.name", "*.firstName", "*.lastName", "*.fullName", "*.joinUrl", "*.token",
  "req.headers.authorization", "req.headers.cookie",
];

export function createLogger(options: { level?: string; destination?: DestinationStream } = {}): Logger {
  return pino(
    { level: options.level ?? process.env.LOG_LEVEL ?? "info", redact: { paths: redactedPaths, censor: "[redacted]" } },
    options.destination,
  );
}

/** One id per request, passed to every job and log line it causes. */
export function newCorrelationId(): string {
  return randomUUID();
}
