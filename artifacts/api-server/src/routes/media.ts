import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { db, mediaTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { DeleteMediaParams, ListMediaQueryParams } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl) throw new Error("SUPABASE_URL is not set.");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

const STORAGE_BUCKET = "media";
const MAX_DIMENSION = 2000;

interface CompressResult {
  buffer: Buffer;
  mimeType: string;
  ext: string;
}

async function compressImage(
  buffer: Buffer,
  mimeType: string,
  originalExt: string,
): Promise<CompressResult> {
  const passThrough = [".svg", ".gif"];
  if (passThrough.includes(originalExt.toLowerCase())) {
    return { buffer, mimeType, ext: originalExt };
  }

  const compressed = await sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  return { buffer: compressed, mimeType: "image/webp", ext: ".webp" };
}

async function uploadToSupabase(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filename, buffer, {
      contentType: mimeType,
      upsert: false,
    });
  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

async function deleteFromSupabase(filename: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.storage.from(STORAGE_BUCKET).remove([filename]);
  } catch {
  }
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

  const items = await db
    .select()
    .from(mediaTable)
    .orderBy(desc(mediaTable.createdAt))
    .limit(limit)
    .offset(offset);
  const [totalRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(mediaTable);

  res.json({
    media: items.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    total: Number(totalRow?.count ?? 0),
    page,
    limit,
  });
});

router.post(
  "/media",
  requireAdmin,
  upload.single("file"),
  async (req, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const originalExt = path.extname(req.file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    const { buffer, mimeType, ext } = await compressImage(
      req.file.buffer,
      req.file.mimetype,
      originalExt,
    );

    const filename = `${unique}${ext}`;

    const publicUrl = await uploadToSupabase(buffer, filename, mimeType);

    const [media] = await db
      .insert(mediaTable)
      .values({
        filename,
        originalName: req.file.originalname,
        url: publicUrl,
        mimeType,
        size: buffer.length,
      })
      .returning();

    res.status(201).json({ ...media, createdAt: media.createdAt.toISOString() });
  },
);

router.delete("/media/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteMediaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [media] = await db
    .delete(mediaTable)
    .where(eq(mediaTable.id, params.data.id))
    .returning();
  if (!media) {
    res.status(404).json({ error: "Media not found" });
    return;
  }
  await deleteFromSupabase(media.filename);
  res.sendStatus(204);
});

export default router;
