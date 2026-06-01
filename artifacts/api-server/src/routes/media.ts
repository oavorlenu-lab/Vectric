import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { db, mediaTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { DeleteMediaParams, ListMediaQueryParams } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  return createClient(url, key);
}

const BUCKET = "media";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype) || file.mimetype === "image/svg+xml";
    if (ext || mime) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

router.get("/media", requireAdmin, async (req, res): Promise<void> => {
  const params = ListMediaQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const items = await db.select().from(mediaTable).orderBy(desc(mediaTable.createdAt)).limit(limit).offset(offset);
  const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(mediaTable);

  res.json({
    media: items.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    total: Number(totalRow?.count ?? 0),
    page,
    limit,
  });
});

router.post("/media", requireAdmin, upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const supabase = getSupabase();
  const ext = path.extname(req.file.originalname).toLowerCase();
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${unique}${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    res.status(500).json({ error: `Storage upload failed: ${uploadError.message}` });
    return;
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  const fileUrl = publicData.publicUrl;

  const [media] = await db.insert(mediaTable).values({
    filename,
    originalName: req.file.originalname,
    url: fileUrl,
    mimeType: req.file.mimetype,
    size: req.file.size,
  }).returning();

  res.status(201).json({ ...media, createdAt: media.createdAt.toISOString() });
});

router.delete("/media/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteMediaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [media] = await db.delete(mediaTable).where(eq(mediaTable.id, params.data.id)).returning();
  if (!media) {
    res.status(404).json({ error: "Media not found" });
    return;
  }

  try {
    const supabase = getSupabase();
    await supabase.storage.from(BUCKET).remove([media.filename]);
  } catch (_) {}

  res.sendStatus(204);
});

export default router;
