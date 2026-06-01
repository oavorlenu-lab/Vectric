import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

function buildConnectionUrl(raw: string): string {
  const isLocal =
    raw.includes("localhost") ||
    raw.includes("127.0.0.1") ||
    raw.includes("helium");
  if (isLocal || raw.includes("sslmode=")) return raw;
  return raw.includes("?") ? `${raw}&sslmode=require` : `${raw}?sslmode=require`;
}

const connectionUrl = buildConnectionUrl(process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString: connectionUrl,
  ssl: connectionUrl.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : false,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
