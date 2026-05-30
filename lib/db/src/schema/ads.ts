import { pgTable, serial, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adSlotsTable = pgTable("ad_slots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position").notNull().unique(),
  script: text("script"),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  description: text("description"),
});

export const insertAdSlotSchema = createInsertSchema(adSlotsTable).omit({ id: true });
export type InsertAdSlot = z.infer<typeof insertAdSlotSchema>;
export type AdSlot = typeof adSlotsTable.$inferSelect;
