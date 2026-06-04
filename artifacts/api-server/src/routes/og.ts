import { Router, type IRouter } from "express";
import sharp from "sharp";

const router: IRouter = Router();

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length <= maxChars) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  // Cap at 3 lines, truncate last with ellipsis if needed
  if (lines.length > 3) {
    const truncated = lines.slice(0, 3);
    if (truncated[2] && truncated[2].length > maxChars - 3) {
      truncated[2] = truncated[2].slice(0, maxChars - 3).trimEnd() + "...";
    } else if (truncated[2]) {
      truncated[2] = truncated[2] + "...";
    }
    return truncated;
  }
  return lines;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSvg(title: string, category: string, siteName: string): string {
  const W = 1200;
  const H = 630;
  const PAD = 72;
  const TITLE_FONT = 62;
  const LINE_HEIGHT = TITLE_FONT * 1.25;
  const MAX_CHARS = 28; // conservative for 62px bold at 1056px content width

  const lines = wrapText(title, MAX_CHARS);
  const totalTitleHeight = lines.length * LINE_HEIGHT;
  // Vertically center the title block in the lower 2/3 of the card
  const titleY = H / 2 - totalTitleHeight / 2 + 30;

  const titleTspans = lines
    .map(
      (line, i) =>
        `<tspan x="${PAD}" dy="${i === 0 ? "0" : LINE_HEIGHT}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const cat = category ? escapeXml(category.toUpperCase()) : "";
  const catPillWidth = cat ? Math.max(cat.length * 13 + 40, 100) : 0;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#4f46e5" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#4f46e5" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Subtle top glow blob -->
  <ellipse cx="960" cy="-60" rx="500" ry="260" fill="url(#glow)"/>

  <!-- Top accent bar -->
  <rect x="0" y="0" width="${W}" height="6" fill="#4f46e5"/>

  <!-- Left accent strip -->
  <rect x="${PAD}" y="${titleY - 8}" width="5" height="${totalTitleHeight + 8}" rx="3" fill="#4f46e5"/>

  <!-- Site name (top-left) -->
  <text x="${PAD + 18}" y="68"
        font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
        font-size="22" font-weight="700" letter-spacing="4"
        fill="#e2e8f0" opacity="0.9">
    ${escapeXml(siteName.toUpperCase())}
  </text>

  <!-- Decorative dot after site name -->
  <circle cx="${PAD + 18 + siteName.length * 14 + 10}" cy="62" r="4" fill="#4f46e5"/>

  <!-- Category pill -->
  ${cat ? `
  <rect x="${PAD + 18}" y="${titleY - 56}" width="${catPillWidth}" height="32" rx="6" fill="#4f46e5" opacity="0.25"/>
  <text x="${PAD + 18 + catPillWidth / 2}" y="${titleY - 34}"
        font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
        font-size="13" font-weight="700" letter-spacing="2"
        text-anchor="middle" fill="#818cf8">
    ${cat}
  </text>` : ""}

  <!-- Title -->
  <text x="${PAD + 18}" y="${titleY}"
        font-family="'Georgia', 'Times New Roman', serif"
        font-size="${TITLE_FONT}" font-weight="700"
        fill="#f8fafc" dominant-baseline="hanging">
    ${titleTspans}
  </text>

  <!-- Bottom divider -->
  <line x1="${PAD}" y1="${H - 72}" x2="${W - PAD}" y2="${H - 72}"
        stroke="#334155" stroke-width="1"/>

  <!-- Domain (bottom-left) -->
  <text x="${PAD}" y="${H - 36}"
        font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
        font-size="20" font-weight="500" fill="#64748b">
    vectric.online
  </text>

  <!-- Read time indicator (bottom-right) -->
  <text x="${W - PAD}" y="${H - 36}"
        font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
        font-size="20" fill="#475569" text-anchor="end">
    Read on Vectric
  </text>
</svg>`;
}

// GET /api/og-image?title=...&category=...
router.get("/og-image", async (req, res): Promise<void> => {
  const title =
    typeof req.query.title === "string" && req.query.title.trim()
      ? req.query.title.trim()
      : "Untitled Article";
  const category =
    typeof req.query.category === "string" ? req.query.category.trim() : "";
  const siteName =
    typeof req.query.site === "string" && req.query.site.trim()
      ? req.query.site.trim()
      : "Vectric";

  const svg = buildSvg(title, category, siteName);

  try {
    const jpeg = await sharp(Buffer.from(svg))
      .resize(1200, 630)
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=604800, immutable"); // 7 days
    res.send(jpeg);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate OG image" });
  }
});

export default router;
