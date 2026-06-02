import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import { db, mediaTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { DeleteMediaParams, ListMediaQueryParams } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";
import { objectStorageClient } from "../replit_integrations/object_storage/objectStorage";

const router: IRouter = Router();

function getObjectStorageBucketId(): string {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) {
    throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID is not set. Provision object storage first.");
  }
  return bucketId;
}

async function uploadToObjectStorage(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const bucketId = getObjectStorageBucketId();
  const bucket = objectStorageClient.bucket(bucketId);
  const file = bucket.file(`media/${filename}`);
  await file.save(buffer, { contentType: mimeType });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucketId}/media/${filename}`;
}

async function deleteFromObjectStorage(filename: string): Promise<void> {
  try {
    const bucketId = getObjectStorageBucketId();
    const bucket = objectStorageClient.bucket(bucketId);
    const file = bucket.file(`media/${filename}`);
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
    }
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

  const publicUrl = await uploadToObjectStorage(req.file.buffer, filename, req.file.mimetype);

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
  await deleteFromObjectStorage(media.filename);
  res.sendStatus(204);
});

export default router;
