import { idempotencyKey } from "@pmaa/core";
import type { MailSender } from "@pmaa/integrations";
import { defineJob } from "../job";

/**
 * Example job showing the pattern end to end. The real confirmation email (template, data,
 * delivery row) is ticket T032; it replaces this example.
 */
export interface ConfirmationEmailData {
  registrationId: string;
  to: string;
  templateVersion: number;
}

export function confirmationEmailJob(mail: MailSender) {
  return defineJob<ConfirmationEmailData>({
    name: "email.confirmation",
    key: (d) => idempotencyKey("email", "confirmation", d.registrationId, d.templateVersion),
    async handle(d, ctx) {
      const key = idempotencyKey("email", "confirmation", d.registrationId, d.templateVersion);
      const result = await mail.send({
        to: d.to,
        subject: "You're registered",
        html: "<p>You're registered.</p>",
        template: { id: "confirmation", version: d.templateVersion },
        idempotencyKey: key,
      });
      ctx.logger.info({ job: "email.confirmation", registrationId: d.registrationId, status: result.status, correlationId: ctx.correlationId }, "email accepted");
    },
  });
}
