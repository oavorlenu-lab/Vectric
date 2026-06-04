import { Helmet } from "react-helmet-async";
import { useGetSettings } from "@workspace/api-client-react";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface ArticleMeta {
  publishedAt?: string | null;
  updatedAt?: string | null;
  authorName?: string | null;
  tags?: string[];
}

interface SeoHeadProps {
  title?: string;
  description?: string;
  image?: string | null;
  type?: "website" | "article";
  article?: ArticleMeta;
  breadcrumbs?: BreadcrumbItem[];
  noIndex?: boolean;
}

const FALLBACK_SITE_NAME = "Vectric";
const FALLBACK_DESCRIPTION =
  "Vectric brings you the latest news, stories, and insights across tech, lifestyle, business, health, entertainment, and more — all in one place.";
const SITE_URL = "https://vectric.online";
const FALLBACK_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export function SeoHead({
  title,
  description,
  image,
  type = "website",
  article,
  breadcrumbs,
  noIndex = false,
}: SeoHeadProps) {
  const { data: settings } = useGetSettings();

  const siteName = settings?.siteName || FALLBACK_SITE_NAME;
  const siteDescription = settings?.siteDescription || FALLBACK_DESCRIPTION;

  const fullTitle = title
    ? `${title} — ${siteName}`
    : settings?.siteTagline
    ? `${siteName} — ${settings.siteTagline}`
    : `${siteName} — Your Daily Read on Everything That Matters`;

  const metaDescription = description || siteDescription;

  // Use pathname only (strip query params & hash) to avoid duplicate-content canonical issues
  const origin =
    typeof window !== "undefined" ? window.location.origin : SITE_URL;
  const canonicalUrl =
    typeof window !== "undefined"
      ? window.location.origin + window.location.pathname
      : SITE_URL;

  const ogImage = image
    ? image.startsWith("http") ? image : `${origin}${image}`
    : FALLBACK_OG_IMAGE;

  const articleJsonLd =
    type === "article" && article
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description: metaDescription,
          image: ogImage,
          url: canonicalUrl,
          ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
          ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
          author: {
            "@type": "Person",
            name: article.authorName || siteName,
          },
          publisher: {
            "@type": "Organization",
            name: siteName,
            logo: {
              "@type": "ImageObject",
              url: `${origin}/favicon.svg`,
            },
          },
          ...(article.tags?.length
            ? { keywords: article.tags.join(", ") }
            : {}),
        }
      : null;

  const breadcrumbJsonLd =
    breadcrumbs && breadcrumbs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: crumb.url.startsWith("http")
              ? crumb.url
              : `${origin}${crumb.url}`,
          })),
        }
      : null;

  const websiteJsonLd =
    type === "website"
      ? {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteName,
          url: origin,
          description: siteDescription,
          potentialAction: {
            "@type": "SearchAction",
            target: `${origin}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }
      : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta
        name="robots"
        content={noIndex ? "noindex, nofollow" : "index, follow"}
      />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content={ogImage.endsWith(".webp") ? "image/webp" : ogImage.endsWith(".png") ? "image/png" : "image/jpeg"} />

      {/* Article-specific Open Graph */}
      {type === "article" && article?.publishedAt && (
        <meta property="article:published_time" content={article.publishedAt} />
      )}
      {type === "article" && article?.updatedAt && (
        <meta property="article:modified_time" content={article.updatedAt} />
      )}
      {type === "article" && article?.authorName && (
        <meta property="article:author" content={article.authorName} />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={title || siteName} />

      {/* JSON-LD Structured Data */}
      {articleJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(articleJsonLd)}
        </script>
      )}
      {breadcrumbJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
      )}
      {websiteJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(websiteJsonLd)}
        </script>
      )}
    </Helmet>
  );
}
