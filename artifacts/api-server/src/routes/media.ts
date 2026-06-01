import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import { db, mediaTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { DeleteMediaParams, ListMediaQueryParams } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "media";

function getSupabaseStorageUrl(filename: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

async function uploadToSupabase(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for media uploads");
  }
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`;
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": mimeType,
      "x-upsert": "true",
    },
    body: buffer,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upload failed: ${err}`);
  }
  return getSupabaseStorageUrl(filename);
}

async function deleteFromSupabase(filename: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: [filename] }),
  });
}

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

  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${unique}${path.extname(req.file.originalname)}`;

  const publicUrl = await uploadToSupabase(req.file.buffer, filename, req.file.mimetype);

  const [media] = await db.insert(mediaTable).values({
    filename,
    originalName: req.file.originalname,
    url: publicUrl,
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
  await deleteFromSupabase(media.filename);
  res.sendStatus(204);
});

export default router;
