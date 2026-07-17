import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const client = createClient({ url });
const sql = readFileSync("./prisma/migrations/20260714121943_init/migration.sql", "utf-8");

async function main() {
  await client.executeMultiple(sql);
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  console.log(
    "Tables created:",
    tables.rows.map((r) => r.name)
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.close());
