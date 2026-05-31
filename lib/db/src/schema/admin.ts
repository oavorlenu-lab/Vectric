import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminTable = pgTable("admin", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminSchema = createInsertSchema(adminTable).omit({ id: true, createdAt: true });
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof adminTable.$inferSelect;

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").default("Vectric"),
  siteTagline: text("site_tagline"),
  siteDescription: text("site_description"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  googleAnalyticsId: text("google_analytics_id"),
  googleSearchConsoleCode: text("google_search_console_code"),
  adsenseClientId: text("adsense_client_id"),
  grokApiKey: text("grok_api_key"),
  footerText: text("footer_text"),
  socialLinks: text("social_links"),
  headerMenu: text("header_menu"),
  footerMenu: text("footer_menu"),
  contactEmail: text("contact_email"),
  resendApiKey: text("resend_api_key"),
  enableUserRegistration: boolean("enable_user_registration").default(false).notNull(),
  maintenanceMode: boolean("maintenance_mode").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SiteSettings = typeof siteSettingsTable.$inferSelect;
