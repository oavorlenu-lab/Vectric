import bcrypt from "bcryptjs";
import { db, adminTable } from "@workspace/db";
import { logger } from "./logger";

export async function seedAdminIfNeeded(): Promise<void> {
  const existing = await db.select().from(adminTable).limit(1);
  if (existing.length > 0) return;

  const passwordHash = await bcrypt.hash("admin123", 10);
  await db.insert(adminTable).values({
    username: "admin",
    passwordHash,
  });

  logger.info("Default admin account created — username: admin, password: admin123. Change this after first login.");
}
