import { describe, expect, it } from "vitest";
import { auditEntry } from "./audit";
import { errorBody, NotFoundError } from "./errors";
import { idempotencyKey } from "./idempotency";

describe("idempotencyKey", () => {
  it("builds the same key for the same job, so a retry is recognized", () => {
    expect(idempotencyKey("email", "confirmation", "reg_1", 2)).toBe("email:confirmation:reg_1:v2");
    expect(idempotencyKey("email", "confirmation", "reg_1", 2)).toBe(idempotencyKey("email", "confirmation", "reg_1", 2));
  });

  it("rejects empty parts and the separator inside a part", () => {
    expect(() => idempotencyKey("", "confirmation", "reg_1")).toThrow();
    expect(() => idempotencyKey("email", "con:firmation", "reg_1")).toThrow();
  });
});

describe("auditEntry", () => {
  const base = { actorId: "u1", entityType: "registration", entityId: "reg_1", correlationId: "c1" };

  it("accepts entity.verb actions", () => {
    expect(auditEntry({ ...base, action: "registration.approved" }).action).toBe("registration.approved");
  });

  it("rejects free-text actions and missing ids", () => {
    expect(() => auditEntry({ ...base, action: "Approved it" })).toThrow();
    expect(() => auditEntry({ ...base, action: "registration.approved", correlationId: "" })).toThrow();
  });
});

describe("errorBody", () => {
  it("maps known errors to their status and hides unknown ones", () => {
    expect(errorBody(new NotFoundError(), "c1")).toMatchObject({ status: 404, body: { error: "not_found", correlationId: "c1" } });
    const hidden = errorBody(new Error("db password is hunter2"), "c1");
    expect(hidden.status).toBe(500);
    expect(JSON.stringify(hidden.body)).not.toContain("hunter2");
  });
});
