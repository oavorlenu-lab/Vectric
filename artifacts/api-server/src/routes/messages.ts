import { Router, type IRouter } from "express";
import { db, contactMessagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  SendMessageBody,
  UpdateMessageBody,
  UpdateMessageParams,
  DeleteMessageParams,
  ListMessagesQueryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/messages", requireAdmin, async (req, res): Promise<void> => {
  const params = ListMessagesQueryParams.safeParse(req.query);
  const msgs = await db.select().from(contactMessagesTable).orderBy(desc(contactMessagesTable.createdAt));
  const filtered = params.success && params.data.read !== undefined
    ? msgs.filter((m) => m.isRead === params.data.read)
    : msgs;
  res.json(filtered.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

router.post("/messages", async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [msg] = await db.insert(contactMessagesTable).values(parsed.data).returning();
  res.status(201).json({ ...msg, createdAt: msg.createdAt.toISOString() });
});

router.patch("/messages/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [msg] = await db.update(contactMessagesTable).set(parsed.data).where(eq(contactMessagesTable.id, params.data.id)).returning();
  if (!msg) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  res.json({ ...msg, createdAt: msg.createdAt.toISOString() });
});

router.delete("/messages/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [msg] = await db.delete(contactMessagesTable).where(eq(contactMessagesTable.id, params.data.id)).returning();
  if (!msg) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
