import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db, mediaTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { DeleteMediaParams, ListMediaQueryParams } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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

  const fileUrl = `/api/media/files/${req.file.filename}`;
  const [media] = await db.insert(mediaTable).values({
    filename: req.file.filename,
    originalName: req.file.originalname,
    url: fileUrl,
    mimeType: req.file.mimetype,
    size: req.file.size,
  }).returning();

  res.status(201).json({ ...media, createdAt: media.createdAt.toISOString() });
});

router.get("/media/files/:filename", (req, res): void => {
  const filename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
  const sanitized = path.basename(filename);
  const filePath = path.join(uploadDir, sanitized);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.sendFile(filePath);
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
  // Try to delete the file
  const filePath = path.join(uploadDir, media.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  res.sendStatus(204);
});

export default router;
