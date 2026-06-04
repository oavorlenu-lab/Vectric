export interface PostEmailOptions {
  siteName: string;
  siteUrl: string;
  postTitle: string;
  postUrl: string;
  excerpt?: string | null;
  contentPreview?: string | null;
  featuredImageUrl?: string | null;
  categoryName?: string | null;
  authorName?: string | null;
  publishedAt?: string | null;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function buildPostEmailHtml(opts: PostEmailOptions): string {
  const {
    siteName,
    siteUrl,
    postTitle,
    postUrl,
    excerpt,
    contentPreview,
    featuredImageUrl,
    categoryName,
    authorName,
    publishedAt,
  } = opts;

  const preview = excerpt
    ? excerpt
    : contentPreview
    ? stripHtml(contentPreview).substring(0, 280) + "…"
    : "";

  const dateStr = formatDate(publishedAt);
  const meta = [categoryName, dateStr, authorName ? `By ${authorName}` : ""]
    .filter(Boolean)
    .join("  ·  ");

  const featuredImageBlock = featuredImageUrl
    ? `
      <tr>
        <td style="padding:0 0 28px 0;">
          <img src="${featuredImageUrl}" alt="${postTitle.replace(/"/g, "&quot;")}"
               width="560" style="width:100%;max-width:560px;border-radius:10px;display:block;" />
        </td>
      </tr>`
    : "";

  const metaBlock = meta
    ? `
      <tr>
        <td style="padding:0 0 14px 0;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;
                   font-size:13px;color:#94a3b8;letter-spacing:0.03em;">
          ${meta}
        </td>
      </tr>`
    : "";

  const categoryBlock = categoryName
    ? `
      <tr>
        <td style="padding:0 0 16px 0;">
          <span style="display:inline-block;background:#ede9fe;color:#6d28d9;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;
                       font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
                       padding:4px 12px;border-radius:4px;">
            ${categoryName}
          </span>
        </td>
      </tr>`
    : "";

  const previewBlock = preview
    ? `
      <tr>
        <td style="padding:0 0 28px 0;font-family:Georgia,'Times New Roman',serif;
                   font-size:17px;line-height:1.75;color:#475569;">
          ${preview}
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${postTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">

  <!-- Preheader (hidden preview text) -->
  <span style="display:none;max-height:0;overflow:hidden;color:#f1f5f9;">
    ${preview.substring(0, 140)}
  </span>

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;
                      overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <!-- Header bar -->
          <tr>
            <td style="background:#0f172a;padding:22px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <a href="${siteUrl}" style="text-decoration:none;">
                      <span style="font-family:Helvetica Neue,Helvetica,Arial,sans-serif;font-size:18px;
                                   font-weight:800;letter-spacing:0.12em;color:#f8fafc;text-transform:uppercase;">
                        ${siteName}
                      </span>
                    </a>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#4f46e5;"></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Label -->
                <tr>
                  <td style="padding:0 0 20px 0;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;
                             font-size:11px;font-weight:700;letter-spacing:0.1em;color:#94a3b8;text-transform:uppercase;">
                    New Article
                  </td>
                </tr>

                ${categoryBlock}
                ${featuredImageBlock}

                <!-- Title -->
                <tr>
                  <td style="padding:0 0 16px 0;">
                    <a href="${postUrl}" style="text-decoration:none;">
                      <span style="font-family:Georgia,'Times New Roman',serif;font-size:28px;
                                   font-weight:700;line-height:1.3;color:#0f172a;">
                        ${postTitle}
                      </span>
                    </a>
                  </td>
                </tr>

                ${metaBlock}

                <!-- Divider -->
                <tr>
                  <td style="padding:0 0 24px 0;">
                    <div style="height:2px;background:linear-gradient(90deg,#4f46e5,#818cf8,transparent);border-radius:2px;"></div>
                  </td>
                </tr>

                ${previewBlock}

                <!-- CTA Button -->
                <tr>
                  <td style="padding:0 0 36px 0;">
                    <a href="${postUrl}"
                       style="display:inline-block;background:#0f172a;color:#ffffff;
                              font-family:Helvetica Neue,Helvetica,Arial,sans-serif;
                              font-size:15px;font-weight:700;letter-spacing:0.02em;
                              padding:14px 32px;border-radius:8px;text-decoration:none;">
                      Read Full Article →
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Helvetica Neue,Helvetica,Arial,sans-serif;font-size:12px;
                             color:#94a3b8;line-height:1.6;text-align:center;">
                    You're receiving this because you subscribed to
                    <a href="${siteUrl}" style="color:#6366f1;text-decoration:none;font-weight:600;">${siteName}</a>.
                    <br />
                    <a href="${siteUrl}" style="color:#94a3b8;text-decoration:underline;">Visit website</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}
