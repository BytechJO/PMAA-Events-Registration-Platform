import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { roles as coreRoles } from "@pmaa/core";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "./client";
import { migrationsFolder, runMigrations } from "./migrate";

/*
 * T010 migrations on real PostgreSQL. Each test gets its own throwaway database, so they start empty
 * and never touch the shared test database. Locally: docker compose up -d db. CI sets REQUIRE_DB_TESTS=1.
 */
const url = process.env.TEST_DATABASE_URL;
if (!url && process.env.REQUIRE_DB_TESTS === "1") throw new Error("TEST_DATABASE_URL is required in CI");

const rollbackFile = new URL("../rollback/0001_core_tables.sql", import.meta.url);

describe.skipIf(!url)("migrations", () => {
  let admin: pg.Pool;
  const created: string[] = [];
  const open: (() => Promise<void>)[] = [];

  beforeAll(() => {
    admin = new pg.Pool({ connectionString: url, max: 1 });
  });

  afterAll(async () => {
    for (const close of open) await close();
    for (const name of created) await admin.query(`drop database if exists "${name}" with (force)`);
    await admin.end();
  });

  /** A new, empty database and a Drizzle handle on it. */
  async function emptyDatabase(): Promise<{ db: Db; pool: pg.Pool }> {
    const name = `pmaa_mig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await admin.query(`create database "${name}"`);
    created.push(name);
    const target = new URL(url!);
    target.pathname = `/${name}`;
    const conn = createDb(target.toString());
    open.push(() => conn.pool.end());
    return conn;
  }

  const tables = async (db: Db) =>
    (await db.execute<{ t: string }>(sql`select table_name as t from information_schema.tables where table_schema = 'public' order by 1`)).rows.map((r) => r.t);
  const applied = async (db: Db) => Number((await db.execute<{ n: string }>(sql`select count(*) as n from drizzle.__drizzle_migrations`)).rows[0]!.n);
  const roleKeys = async (db: Db) => (await db.execute<{ key: string }>(sql`select key from roles order by key`)).rows.map((r) => r.key);

  const core = ["admin_users", "consent_records", "contacts", "events", "message_deliveries", "registration_answers", "registrations", "roles", "sessions", "user_roles"];

  it("apply on an empty database, and a second run changes nothing", async () => {
    const { db } = await emptyDatabase();
    await runMigrations(db);
    expect(await tables(db)).toEqual(expect.arrayContaining([...core, "outbox_messages", "audit_log"]));
    expect(await roleKeys(db)).toEqual([...coreRoles].sort());
    const count = await applied(db);
    await runMigrations(db);
    expect(await applied(db)).toBe(count);
  });

  it("apply from the previous version (only 0000, the skeleton) without losing its data", async () => {
    const { db } = await emptyDatabase();
    // A copy of the migrations folder whose journal stops at 0000: the state of dev before T010.
    const previous = await mkdtemp(path.join(tmpdir(), "pmaa-mig-"));
    try {
      await cp(migrationsFolder, previous, { recursive: true });
      const journalPath = path.join(previous, "meta", "_journal.json");
      const journal = JSON.parse(await readFile(journalPath, "utf8")) as { entries: unknown[] };
      await writeFile(journalPath, JSON.stringify({ ...journal, entries: journal.entries.slice(0, 1) }));
      await migrate(db, { migrationsFolder: previous });
    } finally {
      await rm(previous, { recursive: true, force: true });
    }
    expect(await tables(db)).toEqual(["audit_log", "outbox_messages"]);
    await db.execute(sql`insert into audit_log (actor_id, action, entity_type, entity_id, correlation_id) values ('a', 'x', 'y', 'z', 'c')`);

    await runMigrations(db);
    expect(await tables(db)).toEqual(expect.arrayContaining(core));
    expect((await db.execute(sql`select * from audit_log`)).rows).toHaveLength(1);
  });

  it("are reversible in dev: the rollback script undoes 0001 and 0002, and migrating again restores them", async () => {
    const { db, pool } = await emptyDatabase();
    await runMigrations(db);
    const before = await applied(db);

    await pool.query(await readFile(rollbackFile, "utf8"));
    expect(await tables(db)).toEqual(["audit_log", "outbox_messages"]);
    expect(await applied(db)).toBe(1);
    const types = await db.execute(sql`select typname from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typtype = 'e'`);
    expect(types.rows).toEqual([]);

    await runMigrations(db);
    expect(await tables(db)).toEqual(expect.arrayContaining(core));
    expect(await applied(db)).toBe(before);
    expect(await roleKeys(db)).toEqual([...coreRoles].sort());
  });
});
