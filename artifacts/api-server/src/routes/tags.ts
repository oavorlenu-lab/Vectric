import { Router, type IRouter } from "express";
import { db, tagsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateTagBody, DeleteTagParams } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/tags", async (_req, res): Promise<void> => {
  const tags = await db.select().from(tagsTable).orderBy(tagsTable.name);
  res.json(tags.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })));
});

router.post("/tags", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateTagBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data as typeof parsed.data & { slug?: string };
  const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-");
  const [tag] = await db.insert(tagsTable).values({ ...data, slug }).returning();
  res.status(201).json({ ...tag, createdAt: tag.createdAt.toISOString() });
});

router.delete("/tags/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteTagParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [tag] = await db.delete(tagsTable).where(eq(tagsTable.id, params.data.id)).returning();
  if (!tag) {
    res.status(404).json({ error: "Tag not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
