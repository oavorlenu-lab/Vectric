import { pgTable, serial, text, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const PLACEMENT_TYPES = ["inline", "sidebar", "header", "footer", "floating"] as const;
export const PAGE_TYPES = ["homepage", "blog", "category", "search", "all"] as const;

export type PlacementType = (typeof PLACEMENT_TYPES)[number];
export type PageType = (typeof PAGE_TYPES)[number];

export const adSlotsTable = pgTable("ad_slots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  placementType: text("placement_type").notNull().default("inline"),
  pageType: text("page_type").notNull().default("all"),
  script: text("script"),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const insertAdSlotSchema = createInsertSchema(adSlotsTable).omit({ id: true });
export type InsertAdSlot = z.infer<typeof insertAdSlotSchema>;
export type AdSlot = typeof adSlotsTable.$inferSelect;
