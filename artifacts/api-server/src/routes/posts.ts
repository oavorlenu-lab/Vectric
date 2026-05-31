import { Router, type IRouter } from "express";
import { db, postsTable, postTagsTable, categoriesTable } from "@workspace/db";
import { eq, desc, ilike, and, sql, inArray, or } from "drizzle-orm";
import {
  ListPostsQueryParams,
  CreatePostBody,
  UpdatePostBody,
  GetPostParams,
  UpdatePostParams,
  DeletePostParams,
  GetPostBySlugParams,
  IncrementPostViewParams,
  ListRelatedPostsParams,
  GetTrendingPostsQueryParams,
  GetFeaturedPostsQueryParams,
  GetRecentPostsQueryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function enrichPost(post: typeof postsTable.$inferSelect) {
  const tags = await db.select().from(postTagsTable).where(eq(postTagsTable.postId, post.id));
  let categoryName: string | null = null;
  if (post.categoryId) {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, post.categoryId));
    categoryName = cat?.name ?? null;
  }
  return {
    ...post,
    categoryName,
    tags: tags.map((t) => t.tagName),
    publishedAt: post.publishedAt?.toISOString() ?? null,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

router.get("/posts", async (req, res): Promise<void> => {
  const params = ListPostsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { page = 1, limit = 12, category, tag, status, search, featured } = params.data;
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof and>[] = [];
  if (status) conditions.push(eq(postsTable.status, status));
  if (featured !== undefined) conditions.push(eq(postsTable.isFeatured, featured));

  // Full-text search across title, excerpt and author
  if (search) {
    conditions.push(
      or(
        ilike(postsTable.title, `%${search}%`),
        ilike(postsTable.excerpt, `%${search}%`),
        ilike(postsTable.authorName, `%${search}%`),
      ) as ReturnType<typeof and>
    );
  }

  if (category) {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, category));
    if (cat) conditions.push(eq(postsTable.categoryId, cat.id));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  let postRows = await db.select().from(postsTable).where(whereClause).orderBy(desc(postsTable.createdAt)).limit(limit).offset(offset);

  if (tag) {
    const taggedPostIds = await db.select({ postId: postTagsTable.postId }).from(postTagsTable).where(eq(postTagsTable.tagName, tag));
    const ids = taggedPostIds.map((r) => r.postId);
    postRows = postRows.filter((p) => ids.includes(p.id));
  }

  const total = await db.select({ count: sql<number>`count(*)` }).from(postsTable).where(whereClause);
  const enriched = await Promise.all(postRows.map(enrichPost));

  res.json({ posts: enriched, total: Number(total[0]?.count ?? 0), page, limit });
});

// Live autocomplete suggestions — returns lightweight results fast
router.get("/posts/suggest", async (req, res): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 2) {
    res.json({ suggestions: [] });
    return;
  }
  const posts = await db
    .select({
      id: postsTable.id,
      title: postsTable.title,
      slug: postsTable.slug,
      featuredImageUrl: postsTable.featuredImageUrl,
      categoryId: postsTable.categoryId,
      excerpt: postsTable.excerpt,
    })
    .from(postsTable)
    .where(
      and(
        eq(postsTable.status, "published"),
        or(
          ilike(postsTable.title, `%${q}%`),
          ilike(postsTable.excerpt, `%${q}%`),
        ),
      )
    )
    .orderBy(desc(postsTable.viewCount))
    .limit(6);

  // Attach category name
  const withCategory = await Promise.all(
    posts.map(async (p) => {
      let categoryName: string | null = null;
      if (p.categoryId) {
        const [cat] = await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, p.categoryId));
        categoryName = cat?.name ?? null;
      }
      return { ...p, categoryName };
    })
  );

  res.json({ suggestions: withCategory });
});

// Sitemap XML — all published posts for search engines
router.get("/sitemap.xml", async (_req, res): Promise<void> => {
  const posts = await db
    .select({ slug: postsTable.slug, updatedAt: postsTable.updatedAt })
    .from(postsTable)
    .where(eq(postsTable.status, "published"))
    .orderBy(desc(postsTable.updatedAt));

  const categories = await db
    .select({ slug: categoriesTable.slug })
    .from(categoriesTable);

  // Determine the host from environment or fallback
  const host = process.env.REPLIT_DOMAINS?.split(",")[0]
    ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
    : "https://vectric.replit.app";

  const toDate = (d: Date) => d.toISOString().split("T")[0];

  const postEntries = posts
    .map(
      (p) => `  <url>
    <loc>${host}/blog/${p.slug}</loc>
    <lastmod>${toDate(p.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("\n");

  const categoryEntries = categories
    .map(
      (c) => `  <url>
    <loc>${host}/category/${c.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${host}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${host}/search</loc>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>
${categoryEntries}
${postEntries}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(xml);
});

router.get("/posts/trending", async (req, res): Promise<void> => {
  const params = GetTrendingPostsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 5) : 5;
  const posts = await db.select().from(postsTable).where(eq(postsTable.status, "published")).orderBy(desc(postsTable.viewCount)).limit(limit);
  const enriched = await Promise.all(posts.map(enrichPost));
  res.json(enriched);
});

router.get("/posts/featured", async (req, res): Promise<void> => {
  const params = GetFeaturedPostsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 3) : 3;
  const posts = await db.select().from(postsTable).where(and(eq(postsTable.isFeatured, true), eq(postsTable.status, "published"))).orderBy(desc(postsTable.publishedAt)).limit(limit);
  const enriched = await Promise.all(posts.map(enrichPost));
  res.json(enriched);
});

router.get("/posts/recent", async (req, res): Promise<void> => {
  const params = GetRecentPostsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 6) : 6;
  const posts = await db.select().from(postsTable).where(eq(postsTable.status, "published")).orderBy(desc(postsTable.createdAt)).limit(limit);
  const enriched = await Promise.all(posts.map(enrichPost));
  res.json(enriched);
});

router.get("/posts/slug/:slug", async (req, res): Promise<void> => {
  const params = GetPostBySlugParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [post] = await db.select().from(postsTable).where(eq(postsTable.slug, params.data.slug));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  const enriched = await enrichPost(post);
  res.json(enriched);
});

router.get("/posts/:id/related", async (req, res): Promise<void> => {
  const params = ListRelatedPostsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (!post) {
    res.json([]);
    return;
  }
  const related = await db.select().from(postsTable)
    .where(and(
      eq(postsTable.status, "published"),
      post.categoryId ? eq(postsTable.categoryId, post.categoryId) : undefined,
    ))
    .orderBy(desc(postsTable.createdAt))
    .limit(4);
  const filtered = related.filter((p) => p.id !== post.id).slice(0, 3);
  const enriched = await Promise.all(filtered.map(enrichPost));
  res.json(enriched);
});

router.get("/posts/:id", async (req, res): Promise<void> => {
  const params = GetPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  const enriched = await enrichPost(post);
  res.json(enriched);
});

router.post("/posts", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { tags, ...rest } = parsed.data as typeof parsed.data & { tags?: string[] };
  const slug = rest.slug || generateSlug(rest.title);

  const now = new Date();

  const [post] = await db.insert(postsTable).values({
    ...rest,
    slug,
    updatedAt: now,
    publishedAt: rest.status === "published" ? now : undefined,
    scheduledAt: rest.scheduledAt ? new Date(rest.scheduledAt) : undefined,
  }).returning();

  if (tags && tags.length > 0) {
    await db.insert(postTagsTable).values(tags.map((t) => ({ postId: post.id, tagName: t })));
  }

  const enriched = await enrichPost(post);
  res.status(201).json(enriched);
});

router.patch("/posts/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdatePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { tags, ...rest } = parsed.data as typeof parsed.data & { tags?: string[] };
  const now = new Date();

  const updateData: Record<string, unknown> = { ...rest, updatedAt: now };
  if (rest.status === "published") updateData.publishedAt = now;
  if (rest.scheduledAt) updateData.scheduledAt = new Date(rest.scheduledAt as string);

  const [post] = await db.update(postsTable).set(updateData).where(eq(postsTable.id, params.data.id)).returning();
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  if (tags !== undefined) {
    await db.delete(postTagsTable).where(eq(postTagsTable.postId, post.id));
    if (tags.length > 0) {
      await db.insert(postTagsTable).values(tags.map((t) => ({ postId: post.id, tagName: t })));
    }
  }

  const enriched = await enrichPost(post);
  res.json(enriched);
});

router.delete("/posts/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeletePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(postTagsTable).where(eq(postTagsTable.postId, params.data.id));
  const [post] = await db.delete(postsTable).where(eq(postsTable.id, params.data.id)).returning();
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/posts/:id/view", async (req, res): Promise<void> => {
  const params = IncrementPostViewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.update(postsTable).set({ viewCount: sql`${postsTable.viewCount} + 1` }).where(eq(postsTable.id, params.data.id));
  res.json({ ok: true });
});

export default router;
