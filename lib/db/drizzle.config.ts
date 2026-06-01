import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

function buildConnectionUrl(raw: string): string {
  const isLocal =
    raw.includes("localhost") ||
    raw.includes("127.0.0.1") ||
    raw.includes("helium");
  if (isLocal || raw.includes("sslmode=")) return raw;
  return raw.includes("?") ? `${raw}&sslmode=require` : `${raw}?sslmode=require`;
}

const dbUrl = buildConnectionUrl(process.env.DATABASE_URL);

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
