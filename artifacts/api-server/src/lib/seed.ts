import bcrypt from "bcryptjs";
import { db, adminTable, adSlotsTable } from "@workspace/db";
import { logger } from "./logger";

const DEFAULT_AD_SLOTS = [
  { name: "Homepage — Below Hero",          position: "homepage_below_hero",        description: "Leaderboard 728×90 below the featured section" },
  { name: "Homepage — Between Sections",    position: "homepage_between_sections",  description: "Rectangle 336×280 between latest stories and sidebar" },
  { name: "Homepage — Above Footer",        position: "homepage_above_footer",      description: "Leaderboard 728×90 just above the page footer" },
  { name: "Article — After Intro",          position: "article_after_intro",        description: "In-article ad after the first ~2 paragraphs" },
  { name: "Article — Mid Content",          position: "article_mid_content",        description: "In-article ad midway through the article body" },
  { name: "Article — Before Related Posts", position: "article_before_related",     description: "Leaderboard between article body and related posts" },
  { name: "Article — End",                  position: "article_end",                description: "Rectangle 336×280 after article body and tags" },
  { name: "Article — Sidebar",              position: "article_sidebar",            description: "Sticky 300×250 sidebar on desktop" },
  { name: "Category — Top",                 position: "category_top",               description: "Leaderboard 728×90 below the category header" },
];

export async function seedAdminIfNeeded(): Promise<void> {
  const existing = await db.select().from(adminTable).limit(1);
  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await db.insert(adminTable).values({ username: "admin", passwordHash });
    logger.info("Default admin account created — username: admin, password: admin123. Change this after first login.");
  }
}

export async function seedAdSlotsIfNeeded(): Promise<void> {
  const existing = await db.select().from(adSlotsTable).limit(1);
  if (existing.length > 0) return;

  await db.insert(adSlotsTable).values(DEFAULT_AD_SLOTS);
  logger.info(`Seeded ${DEFAULT_AD_SLOTS.length} ad slot positions.`);
}
