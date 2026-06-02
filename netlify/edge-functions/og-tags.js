export default async function handler(request, context) {
  const userAgent = request.headers.get("user-agent") || "";

  const isCrawler = /facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|Discordbot|Pinterest|Googlebot|bingbot|DuckDuckBot/i.test(userAgent);

  if (!isCrawler) {
    return context.next();
  }

  const url = new URL(request.url);
  const siteOrigin = url.origin;
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (pathParts[0] === "blog" && pathParts[1]) {
    const slug = pathParts[1];

    try {
      const apiRes = await fetch(`https://vectric.onrender.com/api/posts/slug/${slug}`);
      if (!apiRes.ok) return context.next();

      const post = await apiRes.json();

      const title = esc(post.seoTitle || post.title || "Vectric");
      const description = esc(post.seoDescription || post.excerpt || "Read this article on Vectric.");
      const image = post.featuredImageUrl || `${siteOrigin}/og-image.jpg`;
      const pageUrl = `${siteOrigin}/blog/${slug}`;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} — Vectric</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title} — Vectric">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Vectric">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} — Vectric">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  <meta name="twitter:image:alt" content="${title}">
  ${post.publishedAt ? `<meta property="article:published_time" content="${post.publishedAt}">` : ""}
  ${post.updatedAt ? `<meta property="article:modified_time" content="${post.updatedAt}">` : ""}
  ${post.authorName ? `<meta property="article:author" content="${esc(post.authorName)}">` : ""}
  <meta http-equiv="refresh" content="0; url=${pageUrl}">
  <link rel="canonical" href="${pageUrl}">
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <p><a href="${pageUrl}">Read the full article on Vectric</a></p>
</body>
</html>`;

      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    } catch (_e) {
      return context.next();
    }
  }

  return context.next();
}

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
