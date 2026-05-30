import { Router, type IRouter } from "express";
import { db, postsTable, categoriesTable, contactMessagesTable, newsletterSubscribersTable, usersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { GetTopPostsQueryParams } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/stats/overview", requireAdmin, async (_req, res): Promise<void> => {
  const [totalPostsRow] = await db.select({ count: sql<number>`count(*)` }).from(postsTable);
  const [publishedRow] = await db.select({ count: sql<number>`count(*)` }).from(postsTable).where(eq(postsTable.status, "published"));
  const [draftRow] = await db.select({ count: sql<number>`count(*)` }).from(postsTable).where(eq(postsTable.status, "draft"));
  const [scheduledRow] = await db.select({ count: sql<number>`count(*)` }).from(postsTable).where(eq(postsTable.status, "scheduled"));
  const [totalCatsRow] = await db.select({ count: sql<number>`count(*)` }).from(categoriesTable);
  const [totalMsgsRow] = await db.select({ count: sql<number>`count(*)` }).from(contactMessagesTable);
  const [unreadRow] = await db.select({ count: sql<number>`count(*)` }).from(contactMessagesTable).where(eq(contactMessagesTable.isRead, false));
  const [totalSubsRow] = await db.select({ count: sql<number>`count(*)` }).from(newsletterSubscribersTable);
  const [totalUsersRow] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const viewsRow = await db.select({ total: sql<number>`sum(view_count)` }).from(postsTable);
  const recentPosts = await db.select().from(postsTable).orderBy(desc(postsTable.createdAt)).limit(5);

  res.json({
    totalPosts: Number(totalPostsRow?.count ?? 0),
    publishedPosts: Number(publishedRow?.count ?? 0),
    draftPosts: Number(draftRow?.count ?? 0),
    scheduledPosts: Number(scheduledRow?.count ?? 0),
    totalCategories: Number(totalCatsRow?.count ?? 0),
    totalMessages: Number(totalMsgsRow?.count ?? 0),
    unreadMessages: Number(unreadRow?.count ?? 0),
    totalSubscribers: Number(totalSubsRow?.count ?? 0),
    totalViews: Number(viewsRow[0]?.total ?? 0),
    totalUsers: Number(totalUsersRow?.count ?? 0),
    recentActivity: recentPosts.map((p) => ({
      type: "post",
      description: `Post "${p.title}" ${p.status}`,
      createdAt: p.createdAt.toISOString(),
    })),
  });
});

router.get("/stats/posts-by-category", requireAdmin, async (_req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable);
  const result = await Promise.all(
    cats.map(async (cat) => {
      const [row] = await db.select({ count: sql<number>`count(*)` }).from(postsTable).where(eq(postsTable.categoryId, cat.id));
      return { categoryName: cat.name, postCount: Number(row?.count ?? 0) };
    }),
  );
  res.json(result);
});

router.get("/stats/top-posts", requireAdmin, async (req, res): Promise<void> => {
  const params = GetTopPostsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 5) : 5;
  const posts = await db.select().from(postsTable).orderBy(desc(postsTable.viewCount)).limit(limit);
  res.json(posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    featuredImageUrl: p.featuredImageUrl,
    categoryId: p.categoryId,
    categoryName: null,
    authorName: p.authorName,
    readingTime: p.readingTime,
    viewCount: p.viewCount,
    status: p.status,
    isFeatured: p.isFeatured,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    tags: [],
  })));
});

export default router;
