/**
 * Idempotency keys for jobs and outbox messages, so a retried or duplicated job never acts twice.
 * Shape: "<channel>:<purpose>:<entityId>:v<version>", for example "email:confirmation:reg_123:v2".
 */
export function idempotencyKey(channel: string, purpose: string, entityId: string, version: number | string = 1): string {
  for (const [name, part] of Object.entries({ channel, purpose, entityId })) {
    if (!part || part.includes(":")) throw new Error(`idempotencyKey: invalid ${name}`);
  }
  return `${channel}:${purpose}:${entityId}:v${version}`;
}
