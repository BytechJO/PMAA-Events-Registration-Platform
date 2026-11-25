import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { createLogger, newCorrelationId } from "./logger";

function capture() {
  const lines: string[] = [];
  const destination = new Writable({
    write(chunk, _enc, done) {
      lines.push(chunk.toString());
      done();
    },
  });
  return { lines, logger: createLogger({ destination }) };
}

describe("logger", () => {
  it("never writes names, emails, phones or join links", () => {
    const { lines, logger } = capture();
    logger.info({ email: "teacher@example.org", registration: { phone: "+15550100", fullName: "Hala", joinUrl: "https://teams/x" } }, "registered");
    const out = lines.join("");
    expect(out).toContain("registered");
    for (const secret of ["teacher@example.org", "+15550100", "Hala", "https://teams/x"]) expect(out).not.toContain(secret);
    expect(out).toContain("[redacted]");
  });

  it("creates a new correlation id per request", () => {
    expect(newCorrelationId()).not.toBe(newCorrelationId());
  });
});
