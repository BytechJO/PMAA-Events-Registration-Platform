/** One audit log entry (spec §18): who did what to which record, with the state before and after. */
export interface AuditEntry {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  correlationId: string;
}

const actionPattern = /^[a-z_]+\.[a-z_]+$/;

/** Builds an audit entry; actions are "entity.verb" in snake case, e.g. "registration.approved". */
export function auditEntry(entry: AuditEntry): AuditEntry {
  if (!actionPattern.test(entry.action)) throw new Error(`auditEntry: action must look like "entity.verb", got "${entry.action}"`);
  if (!entry.actorId || !entry.entityId || !entry.correlationId) throw new Error("auditEntry: actorId, entityId and correlationId are required");
  return entry;
}
