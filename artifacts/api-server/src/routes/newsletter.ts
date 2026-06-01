import { Router, type IRouter } from "express";
import { db, newsletterSubscribersTable, siteSettingsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { SubscribeNewsletterBody, DeleteSubscriberParams, SendNewsletterBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";
import { Resend } from "resend";
import { logger } from "../lib/logger";

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
    const [existing] = await db.select().from(newsletterSubscribersTable).where(eq(newsletterSubscribersTable.email, parsed.data.email));
    res.status(200).json({ ...existing, createdAt: existing.createdAt.toISOString() });
  }
});

router.post("/newsletter/send", requireAdmin, async (req, res): Promise<void> => {
  const parsed = SendNewsletterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [settings] = await db.select().from(siteSettingsTable);
  const apiKey = settings?.resendApiKey;

  if (!apiKey) {
    res.status(400).json({ error: "Resend API key not configured. Add it in Admin → Settings → Email." });
    return;
  }

  const contactEmail = settings?.contactEmail;
  if (!contactEmail) {
    res.status(400).json({
      error: "Sender email not configured. Set your Contact Email in Admin → Settings. It must be an email from a domain you have verified in your Resend account.",
    });
    return;
  }

  const subscribers = await db.select().from(newsletterSubscribersTable).orderBy(desc(newsletterSubscribersTable.createdAt));

  if (subscribers.length === 0) {
    res.json({ sent: 0, failed: 0, message: "No subscribers to send to." });
    return;
  }

  const resend = new Resend(apiKey);
  const siteName = settings?.siteName || "Newsletter";
  const fromName = parsed.data.fromName || siteName;
  const fromAddress = `${fromName} <${contactEmail}>`;

  let sent = 0;
  let failed = 0;
  let firstError: string | null = null;

  for (const sub of subscribers) {
    try {
      const result = await resend.emails.send({
        from: fromAddress,
        to: sub.email,
        subject: parsed.data.subject,
        html: parsed.data.html,
        replyTo: contactEmail,
      });

      if (result.error) {
        logger.warn({ email: sub.email, error: result.error }, "Resend rejected email");
        if (!firstError) firstError = result.error.message;
        failed++;
      } else {
        sent++;
      }
    } catch (err: any) {
      logger.error({ email: sub.email, err }, "Failed to send newsletter email");
      if (!firstError) firstError = err?.message || "Unknown error";
      failed++;
    }
  }

  if (sent === 0 && failed > 0) {
    res.status(500).json({
      sent,
      failed,
      message: `All ${failed} emails failed to send.`,
      error: firstError
        ? `Resend error: ${firstError}. Make sure your Contact Email domain is verified in your Resend account at resend.com/domains.`
        : "All emails failed. Check that your Resend API key is valid and your sender domain is verified.",
    });
    return;
  }

  res.json({
    sent,
    failed,
    message: `Sent to ${sent} subscriber${sent !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}.`,
    ...(firstError ? { warning: `Some failed — Resend: ${firstError}` } : {}),
  });
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
