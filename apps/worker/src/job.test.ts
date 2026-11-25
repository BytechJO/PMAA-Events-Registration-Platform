import { createLogger } from "@pmaa/core";
import { FakeMailSender } from "@pmaa/integrations";
import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { MemoryProcessedStore, runJob } from "./job";
import { confirmationEmailJob } from "./jobs/confirmation-email";

const quiet = createLogger({ destination: new Writable({ write: (_c, _e, done) => done() }) });
const data = { registrationId: "reg_1", to: "teacher@example.org", templateVersion: 1 };

describe("job pattern", () => {
  it("does the work once even when the same job runs twice (AT-09 style)", async () => {
    const mail = new FakeMailSender();
    const store = new MemoryProcessedStore();
    const job = confirmationEmailJob(mail);
    const deps = { store, logger: quiet, correlationId: "c1" };

    expect(await runJob(job, data, deps)).toBe("done");
    expect(await runJob(job, data, deps)).toBe("skipped");
    expect(mail.sent).toHaveLength(1);
  });

  it("does not mark the job done when the provider fails, so the retry sends it", async () => {
    const mail = new FakeMailSender();
    mail.failNext = new Error("Graph outage");
    const store = new MemoryProcessedStore();
    const job = confirmationEmailJob(mail);
    const deps = { store, logger: quiet, correlationId: "c1" };

    await expect(runJob(job, data, deps)).rejects.toThrow("Graph outage");
    expect(await runJob(job, data, deps)).toBe("done");
    expect(mail.sent).toHaveLength(1);
  });

  it("treats a new template version as a different job", async () => {
    const mail = new FakeMailSender();
    const store = new MemoryProcessedStore();
    const job = confirmationEmailJob(mail);
    const deps = { store, logger: quiet, correlationId: "c1" };
    await runJob(job, data, deps);
    await runJob(job, { ...data, templateVersion: 2 }, deps);
    expect(mail.sent).toHaveLength(2);
  });
});
