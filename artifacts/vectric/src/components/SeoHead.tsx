import { Helmet } from "react-helmet-async";

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
  noIndex?: boolean;
}

const SITE_NAME = "Vectric";
const DEFAULT_DESCRIPTION =
  "Vectric is a premium multi-category blog covering Technology, Sports, Business, Health, Travel, Entertainment, Lifestyle, and Science.";

export function SeoHead({
  title,
  description,
  image,
  type = "website",
  article,
  noIndex = false,
}: SeoHeadProps) {
  const fullTitle = title
    ? `${title} — ${SITE_NAME}`
    : `${SITE_NAME} — Premium Insights Across Every Domain`;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const canonicalUrl =
    typeof window !== "undefined" ? window.location.href : "";
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  const jsonLd =
    type === "article" && article
      ? JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description: metaDescription,
          ...(image ? { image } : {}),
          url: canonicalUrl,
          ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
          ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
          author: {
            "@type": "Person",
            name: article.authorName || SITE_NAME,
          },
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            logo: {
              "@type": "ImageObject",
              url: `${origin}/favicon.svg`,
            },
          },
          ...(article.tags?.length
            ? { keywords: article.tags.join(", ") }
            : {}),
        })
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

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {image && <meta property="og:image" content={image} />}

      <meta
        name="twitter:card"
        content={image ? "summary_large_image" : "summary"}
      />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {image && <meta name="twitter:image" content={image} />}

      {jsonLd && (
        <script type="application/ld+json">{jsonLd}</script>
      )}
    </Helmet>
  );
}
