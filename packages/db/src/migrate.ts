import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Db } from "./client";

export const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

/** Applies every pending migration in packages/db/drizzle. Safe to run again. */
export async function runMigrations(db: Db): Promise<void> {
  await migrate(db, { migrationsFolder });
}
