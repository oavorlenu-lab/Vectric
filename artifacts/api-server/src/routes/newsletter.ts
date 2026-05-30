import { Router, type IRouter } from "express";
import { db, newsletterSubscribersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { SubscribeNewsletterBody, DeleteSubscriberParams } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/newsletter/subscribe", async (req, res): Promise<void> => {
  const parsed = SubscribeNewsletterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [sub] = await db.insert(newsletterSubscribersTable).values(parsed.data).returning();
    res.status(201).json({ ...sub, createdAt: sub.createdAt.toISOString() });
  } catch {
    // unique constraint violation — already subscribed
    const [existing] = await db.select().from(newsletterSubscribersTable).where(eq(newsletterSubscribersTable.email, parsed.data.email));
    res.status(200).json({ ...existing, createdAt: existing.createdAt.toISOString() });
  }
});

router.get("/newsletter/subscribers", requireAdmin, async (_req, res): Promise<void> => {
  const subs = await db.select().from(newsletterSubscribersTable).orderBy(desc(newsletterSubscribersTable.createdAt));
  res.json(subs.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })));
});

router.delete("/newsletter/subscribers/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteSubscriberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [sub] = await db.delete(newsletterSubscribersTable).where(eq(newsletterSubscribersTable.id, params.data.id)).returning();
  if (!sub) {
    res.status(404).json({ error: "Subscriber not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
