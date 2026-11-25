/**
 * The adapter shape every outside service follows: one small interface, a real implementation
 * (Microsoft Graph sendMail, ticket T031) and a fake used by tests and by local development.
 * Jobs depend on the interface only, so tests never call a real provider.
 */
export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  /** Template id and version, stored with the delivery (spec §14). */
  template: { id: string; version: number };
  idempotencyKey: string;
}

/** Graph answers 202 Accepted: that means accepted, not delivered (spec §15.2). */
export interface MailResult {
  status: "accepted";
  providerMessageId: string;
}

export interface MailSender {
  send(message: MailMessage): Promise<MailResult>;
}

/** In-memory sender for tests. Set failNext to simulate a provider outage. */
export class FakeMailSender implements MailSender {
  readonly sent: MailMessage[] = [];
  failNext: Error | null = null;

  async send(message: MailMessage): Promise<MailResult> {
    if (this.failNext) {
      const error = this.failNext;
      this.failNext = null;
      throw error;
    }
    this.sent.push(message);
    return { status: "accepted", providerMessageId: `fake-${this.sent.length}` };
  }
}
