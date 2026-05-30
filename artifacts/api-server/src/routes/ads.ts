import { Router, type IRouter } from "express";
import { db, adSlotsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { z } from "zod/v4";

const router: IRouter = Router();

const CreateAdBody = z.object({
  name: z.string().min(1),
  placementType: z.enum(["inline", "sidebar", "header", "footer", "floating"]),
  pageType: z.enum(["homepage", "blog", "category", "search", "all"]),
  script: z.string().optional(),
  isEnabled: z.boolean().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const UpdateAdBody = z.object({
  name: z.string().min(1).optional(),
  placementType: z.enum(["inline", "sidebar", "header", "footer", "floating"]).optional(),
  pageType: z.enum(["homepage", "blog", "category", "search", "all"]).optional(),
  script: z.string().optional().nullable(),
  isEnabled: z.boolean().optional(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

router.get("/ads", async (req, res): Promise<void> => {
  const { pageType, placementType } = req.query as Record<string, string>;
  const all = await db.select().from(adSlotsTable).orderBy(asc(adSlotsTable.sortOrder), asc(adSlotsTable.id));

  if (!pageType && !placementType) {
    res.json(all);
    return;
  }

  const filtered = all.filter(slot => {
    const matchPage = !pageType || slot.pageType === pageType || slot.pageType === "all";
    const matchPlacement = !placementType || slot.placementType === placementType;
    return matchPage && matchPlacement;
  });

  res.json(filtered);
});

router.post("/ads", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateAdBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [slot] = await db.insert(adSlotsTable).values({
    name: parsed.data.name,
    placementType: parsed.data.placementType,
    pageType: parsed.data.pageType,
    script: parsed.data.script ?? null,
    isEnabled: parsed.data.isEnabled ?? false,
    description: parsed.data.description ?? null,
    sortOrder: parsed.data.sortOrder ?? 0,
  }).returning();
  res.status(201).json(slot);
});

router.patch("/ads/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateAdBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [slot] = await db.update(adSlotsTable)
    .set({ ...parsed.data, script: parsed.data.script ?? undefined })
    .where(eq(adSlotsTable.id, id))
    .returning();

  if (!slot) { res.status(404).json({ error: "Ad not found" }); return; }
  res.json(slot);
});

router.delete("/ads/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(adSlotsTable).where(eq(adSlotsTable.id, id));
  res.status(204).end();
});

export default router;
