import { Router, type IRouter } from "express";
import { db, siteSettingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/settings", async (_req, res): Promise<void> => {
  let [settings] = await db.select().from(siteSettingsTable);
  if (!settings) {
    [settings] = await db.insert(siteSettingsTable).values({}).returning();
  }
  res.json({ ...settings, updatedAt: settings.updatedAt.toISOString() });
});

router.patch("/settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  let [existing] = await db.select().from(siteSettingsTable);
  if (!existing) {
    [existing] = await db.insert(siteSettingsTable).values({}).returning();
  }
  const [settings] = await db.update(siteSettingsTable).set({ ...parsed.data, updatedAt: new Date() }).returning();
  res.json({ ...settings, updatedAt: settings.updatedAt.toISOString() });
});

export default router;
