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

async function main() {
  for (const folder of migrationFolders) {
    const sql = readFileSync(join(MIGRATIONS_DIR, folder, "migration.sql"), "utf-8");
    const statements = sql
      .split(";")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      try {
        await client.execute(statement);
      } catch (error) {
        // Already-applied migrations re-run harmlessly; only "already
        // exists" errors are expected here, anything else is real.
        if (error instanceof Error && /already exists/i.test(error.message)) {
          continue;
        }
        throw error;
      }
    }
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
