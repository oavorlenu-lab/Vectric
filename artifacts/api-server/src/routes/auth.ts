import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, adminTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AdminLoginBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  const [admin] = await db.select().from(adminTable).where(eq(adminTable.username, username));

  if (!admin) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.adminId = admin.id;
  req.session.adminUsername = admin.username;

  res.json({ id: admin.id, username: admin.username, isAdmin: true });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res): void => {
  if (!req.session.adminId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({
    id: req.session.adminId,
    username: req.session.adminUsername,
    isAdmin: true,
  });
});

router.patch("/auth/credentials", requireAdmin, async (req, res): Promise<void> => {
  const { currentPassword, newUsername, newPassword } = req.body;

  if (!currentPassword) {
    res.status(400).json({ error: "Current password is required" });
    return;
  }

  const [admin] = await db.select().from(adminTable).where(eq(adminTable.id, req.session.adminId!));
  if (!admin) {
    res.status(404).json({ error: "Admin not found" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const updates: { username?: string; passwordHash?: string } = {};

  if (newUsername && newUsername.trim() && newUsername !== admin.username) {
    updates.username = newUsername.trim();
  }

  if (newPassword && newPassword.length >= 6) {
    updates.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  await db.update(adminTable).set(updates).where(eq(adminTable.id, admin.id));

  if (updates.username) {
    req.session.adminUsername = updates.username;
  }

  res.json({ ok: true, username: updates.username ?? admin.username });
});

export default router;
