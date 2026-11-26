import { readFile } from "node:fs/promises";
import { roles as coreRoles } from "@pmaa/core";
import { describe, expect, it } from "vitest";
import {
  adminUserStatus,
  certificateRule,
  deliveryStatus,
  eventStatus,
  eventType,
  messageChannel,
  registrationSource,
  registrationStatus,
} from "./schema";

/* Checks that need no database: the hand-written migration files stay in step with the code. */

const file = (rel: string) => readFile(new URL(`../${rel}`, import.meta.url), "utf8");

describe("roles seed (drizzle/0002_seed_roles.sql)", () => {
  it("seeds exactly the roles in @pmaa/core", async () => {
    const sql = await file("drizzle/0002_seed_roles.sql");
    const keys = [...sql.matchAll(/\('([a-z_]+)',/g)].map((m) => m[1]);
    expect(keys.sort()).toEqual([...coreRoles].sort());
  });
});

describe("rollback script (rollback/0001_core_tables.sql)", () => {
  it("forgets exactly the migrations it undoes (0001 and later)", async () => {
    const journal = JSON.parse(await file("drizzle/meta/_journal.json")) as { entries: { tag: string; when: number }[] };
    const first = journal.entries.find((e) => e.tag === "0001_core_tables");
    expect(first).toBeDefined();
    expect(await file("rollback/0001_core_tables.sql")).toContain(`"created_at" >= ${first!.when};`);
  });

  it("drops every enum type the schema creates", async () => {
    const rollback = await file("rollback/0001_core_tables.sql");
    for (const e of [adminUserStatus, certificateRule, deliveryStatus, eventStatus, eventType, messageChannel, registrationSource, registrationStatus]) {
      expect(rollback).toContain(`DROP TYPE IF EXISTS "public"."${e.enumName}";`);
    }
  });
});
