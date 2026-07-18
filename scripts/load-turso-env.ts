import { existsSync, readFileSync } from "node:fs";

// Lets DATABASE_URL be supplied via a local .env.turso file instead of an
// inline shell variable -- some Windows terminal setups mangle long
// tokens passed inline (stray characters appear at a fixed offset,
// tripping ByteString conversion errors in the HTTP client).
const ENV_FILE = ".env.turso";

if (!process.env.DATABASE_URL && existsSync(ENV_FILE)) {
  const line = readFileSync(ENV_FILE, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("DATABASE_URL="));

  if (line) {
    process.env.DATABASE_URL = line.slice("DATABASE_URL=".length).trim();
  }
}
