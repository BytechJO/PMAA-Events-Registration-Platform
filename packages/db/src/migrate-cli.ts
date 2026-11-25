import { createLogger } from "@pmaa/core";
import { createDb } from "./client";
import { runMigrations } from "./migrate";

const log = createLogger();
const url = process.env.DATABASE_URL;
if (!url) {
  log.error("DATABASE_URL is not set");
  process.exit(1);
}

const { db, pool } = createDb(url);
try {
  await runMigrations(db);
  log.info("migrations applied");
} finally {
  await pool.end();
}
