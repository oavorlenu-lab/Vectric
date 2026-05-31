import { Router, type IRouter } from "express";
import { db, adSlotsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateAdSlotBody, UpdateAdSlotParams } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/ads", async (_req, res): Promise<void> => {
  const slots = await db.select().from(adSlotsTable).orderBy(adSlotsTable.id);
  res.json(slots);
});

router.patch("/ads/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateAdSlotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAdSlotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [slot] = await db.update(adSlotsTable).set(parsed.data).where(eq(adSlotsTable.id, params.data.id)).returning();
  if (!slot) {
    res.status(404).json({ error: "Ad slot not found" });
    return;
  }
  res.json(slot);
});

export default router;
