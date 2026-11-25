import { describe, expect, it } from "vitest";
import { FakeMailSender, type MailMessage } from "./mail";

const message: MailMessage = {
  to: "teacher@example.org",
  subject: "You're registered",
  html: "<p>See you there</p>",
  template: { id: "confirmation", version: 1 },
  idempotencyKey: "email:confirmation:reg_1:v1",
};

describe("FakeMailSender", () => {
  it("records what was sent and reports accepted, not delivered", async () => {
    const mail = new FakeMailSender();
    const result = await mail.send(message);
    expect(result.status).toBe("accepted");
    expect(mail.sent).toHaveLength(1);
  });

  it("can simulate one provider outage, then recovers", async () => {
    const mail = new FakeMailSender();
    mail.failNext = new Error("503 from Graph");
    await expect(mail.send(message)).rejects.toThrow("503");
    await expect(mail.send(message)).resolves.toMatchObject({ status: "accepted" });
  });
});
