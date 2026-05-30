import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull().default(""),
  featuredImageUrl: text("featured_image_url"),
  categoryId: integer("category_id"),
  authorName: text("author_name").default("Vectric Editorial"),
  readingTime: integer("reading_time"),
  viewCount: integer("view_count").default(0).notNull(),
  status: text("status").notNull().default("draft"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  ctaButtons: text("cta_buttons"),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postTagsTable = pgTable("post_tags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  tagName: text("tag_name").notNull(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true, viewCount: true, createdAt: true, updatedAt: true });
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
