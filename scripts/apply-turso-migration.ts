import "./load-turso-env";
import { createClient } from "@libsql/client";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const client = createClient({ url });
const MIGRATIONS_DIR = "./prisma/migrations";

const migrationFolders = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

async function ensureBookkeepingTable() {
  await client.execute(
    `CREATE TABLE IF NOT EXISTS "_turso_migrations_applied" ("name" TEXT NOT NULL PRIMARY KEY)`
  );
}

async function isRecordedApplied(name: string): Promise<boolean> {
  const result = await client.execute({
    sql: `SELECT 1 FROM "_turso_migrations_applied" WHERE "name" = ?`,
    args: [name],
  });
  return result.rows.length > 0;
}

async function recordApplied(name: string) {
  await client.execute({
    sql: `INSERT OR IGNORE INTO "_turso_migrations_applied" ("name") VALUES (?)`,
    args: [name],
  });
}

async function main() {
  await ensureBookkeepingTable();

  for (const folder of migrationFolders) {
    if (await isRecordedApplied(folder)) {
      console.log(`Already applied (recorded): ${folder}`);
      continue;
    }

    const sql = readFileSync(join(MIGRATIONS_DIR, folder, "migration.sql"), "utf-8");
    const statements = sql
      .split(";")
      .map((statement) => statement.trim())
      .filter(Boolean);

    try {
      for (const statement of statements) {
        await client.execute(statement);
      }
    } catch (error) {
      // A later migration can outrun an earlier one it depends on (e.g. a
      // table-rebuild migration referencing a column a subsequent
      // migration already dropped, if this ran once before this
      // bookkeeping table existed). Treat that as "already effectively
      // applied" rather than a fatal error and stop partway through --
      // don't skip remaining statements individually, since for a
      // RedefineTables migration that would DROP the real table without
      // its data ever having been copied into the replacement.
      const message = error instanceof Error ? error.message : String(error);
      if (/already exists|no such column|no such table|duplicate column/i.test(message)) {
        console.log(`Skipping (schema already past this point): ${folder} -- ${message}`);
        // A RedefineTables migration that failed partway through may have
        // left an empty "new_X" table behind from its own CREATE TABLE
        // statement; clean it up so it doesn't linger unused.
        const tempTableMatch = sql.match(/CREATE TABLE "(new_\w+)"/);
        if (tempTableMatch) {
          await client.execute(`DROP TABLE IF EXISTS "${tempTableMatch[1]}"`);
        }
      } else {
        throw error;
      }
    }

    await recordApplied(folder);
    console.log(`Applied migration: ${folder}`);
  }

  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  console.log(
    "Tables present:",
    tables.rows.map((r) => r.name)
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.close());
