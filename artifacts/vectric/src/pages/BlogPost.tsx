import { useState, useMemo } from "react";
import { useGetPostBySlug, useIncrementPostView, useListRelatedPosts } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdZone } from "@/components/AdZone";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Twitter, Facebook, Linkedin, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

/** Split HTML content on inline ad marker divs inserted by the editor */
function parseContentSegments(html: string): Array<{ type: "html" | "ad"; content: string }> {
  if (typeof DOMParser === "undefined") return [{ type: "html", content: html }];

  const doc = new DOMParser().parseFromString(html, "text/html");
  const segments: Array<{ type: "html" | "ad"; content: string }> = [];
  let currentHtml = "";

  doc.body.childNodes.forEach((node) => {
    const el = node as Element;
    if (el.nodeType === 1 && el.getAttribute?.("data-vectric-ad") === "inline") {
      if (currentHtml.trim()) segments.push({ type: "html", content: currentHtml });
      currentHtml = "";
      segments.push({ type: "ad", content: "" });
    } else {
      if (el.nodeType === 3) {
        currentHtml += (node as Text).textContent || "";
      } else if (el.outerHTML) {
        currentHtml += el.outerHTML;
      }
    }
  });

  if (currentHtml.trim()) segments.push({ type: "html", content: currentHtml });
  return segments;
}

/** Auto-add IDs to h2/h3 for TOC links */
function processContentHeadings(html: string): { processedHtml: string; headings: { id: string; text: string; level: number }[] } {
  if (typeof DOMParser === "undefined") return { processedHtml: html, headings: [] };

  const doc = new DOMParser().parseFromString(html, "text/html");
  const headings: { id: string; text: string; level: number }[] = [];
  doc.querySelectorAll("h2, h3").forEach((el, index) => {
    const id = el.id || `heading-${index}`;
    el.id = id;
    headings.push({ id, text: el.textContent || "", level: el.tagName === "H2" ? 2 : 3 });
  });

  return { processedHtml: doc.body.innerHTML, headings };
}

export default function BlogPost() {
  const { slug } = useParams();
  const [viewTracked, setViewTracked] = useState(false);

  const { data: post, isLoading } = useGetPostBySlug(slug || "", { query: { enabled: !!slug } });
  const { data: relatedPosts } = useListRelatedPosts(post?.id || 0, { query: { enabled: !!post?.id } });
  const incrementView = useIncrementPostView();

  useEffect(() => {
    if (post?.id && !viewTracked) {
      incrementView.mutate({ id: post.id });
      setViewTracked(true);
    }
  }, [post?.id, viewTracked]);

  const { processedHtml, headings } = useMemo(
    () => processContentHeadings(post?.content || ""),
    [post?.content]
  );

  const contentSegments = useMemo(
    () => parseContentSegments(processedHtml),
    [processedHtml]
  );

  const hasInlineAdMarkers = contentSegments.some((s) => s.type === "ad");

  if (isLoading) {
    return (
      <PublicLayout pageType="blog">
        <div className="container mx-auto px-4 py-16 max-w-4xl animate-pulse">
          <div className="w-24 h-6 bg-muted rounded mb-6" />
          <div className="w-full h-16 bg-muted rounded mb-4" />
          <div className="w-3/4 h-16 bg-muted rounded mb-8" />
          <div className="w-full aspect-[2/1] bg-muted rounded-xl mb-12" />
          <div className="space-y-4">
            <div className="w-full h-4 bg-muted rounded" />
            <div className="w-full h-4 bg-muted rounded" />
            <div className="w-5/6 h-4 bg-muted rounded" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!post) {
    return (
      <PublicLayout pageType="blog">
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist or has been removed.</p>
          <Button asChild><Link href="/">Return Home</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  let ctaButtons: any[] = [];
  try { if (post.ctaButtons) ctaButtons = JSON.parse(post.ctaButtons); } catch (e) {}

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  return (
    <PublicLayout pageType="blog">
      {/* Header zone ad */}
      <AdZone pageType="blog" placementType="header" className="container mx-auto px-4 max-w-5xl !mt-4 !mb-0" />

      <article className="pb-20">
        <header className="container mx-auto px-4 pt-16 pb-12 max-w-4xl text-center">
          {post.categoryName && (
            <Link
              href={`/category/${post.categoryName.toLowerCase().replace(/\s+/g, "-")}`}
              className="inline-block text-sm font-bold text-primary tracking-wider uppercase mb-6 hover:underline"
            >
              {post.categoryName}
            </Link>
          )}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 leading-tight">{post.title}</h1>
          {post.excerpt && (
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8">{post.excerpt}</p>
          )}
          <div className="flex items-center justify-center gap-4 text-sm font-medium text-muted-foreground">
            {post.authorName && <span className="text-foreground">By {post.authorName}</span>}
            <span>•</span>
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            {post.readingTime && (
              <><span>•</span><span>{post.readingTime} min read</span></>
            )}
          </div>
        </header>

        {post.featuredImageUrl && (
          <div className="container mx-auto px-4 max-w-5xl mb-16">
            <div className="aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden bg-muted w-full">
              <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-12">

            {/* Sidebar */}
            <div className="lg:w-64 shrink-0 order-2 lg:order-1">
              <div className="sticky top-24 space-y-10">
                {/* Share */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Share</h4>
                  <div className="flex flex-wrap lg:flex-col gap-2">
                    <Button variant="outline" size="sm" className="w-10 h-10 p-0 rounded-full" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=${encodeURIComponent(post.title)}`)}>
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="w-10 h-10 p-0 rounded-full" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`)}>
                      <Facebook className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="w-10 h-10 p-0 rounded-full" onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${window.location.href}&title=${encodeURIComponent(post.title)}`)}>
                      <Linkedin className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="w-10 h-10 p-0 rounded-full" onClick={handleCopyLink}>
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Table of Contents */}
                {headings.length > 0 && (
                  <div className="hidden lg:block">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">In this article</h4>
                    <ul className="space-y-2 text-sm">
                      {headings.map((heading) => (
                        <li key={heading.id} className={`${heading.level === 3 ? "pl-4" : ""}`}>
                          <a href={`#${heading.id}`} className="text-muted-foreground hover:text-primary transition-colors block line-clamp-2">
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sidebar ads */}
                <AdZone pageType="blog" placementType="sidebar" />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 order-1 lg:order-2 max-w-3xl">

              {/* After-intro ad (only when no manual inline markers) */}
              {!hasInlineAdMarkers && (
                <AdZone pageType="blog" placementType="inline" className="mb-8" />
              )}

              {/* Article body — split by inline ad markers if present */}
              {contentSegments.map((seg, i) =>
                seg.type === "ad" ? (
                  <AdZone key={`ad-${i}`} pageType="blog" placementType="inline" className="my-8" />
                ) : seg.content ? (
                  <div
                    key={`html-${i}`}
                    className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-bold prose-p:leading-relaxed prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: seg.content }}
                  />
                ) : null
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t">
                  {post.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">{tag}</span>
                  ))}
                </div>
              )}

              {/* CTA Buttons */}
              {ctaButtons.length > 0 && (
                <div className="mt-12 flex flex-wrap gap-4 justify-center bg-muted/50 p-8 rounded-2xl border">
                  {ctaButtons.map((btn: any, i: number) => (
                    <Button key={i} asChild variant={btn.style === "outline" ? "outline" : "default"} size="lg">
                      <a href={btn.url} target="_blank" rel="noopener noreferrer">{btn.text}</a>
                    </Button>
                  ))}
                </div>
              )}

              {/* End-of-article ad */}
              <AdZone pageType="blog" placementType="inline" className="mt-12" />
            </div>

            <div className="hidden xl:block w-32 shrink-0 order-3" />
          </div>
        </div>
      </article>

      {/* Before-related ad */}
      <AdZone pageType="blog" placementType="footer" className="container mx-auto px-4 max-w-6xl" />

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="bg-muted py-16 border-t">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-serif font-bold mb-10 text-center">Read Next</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((related) => (
                <div key={related.id} className="group bg-card rounded-xl overflow-hidden shadow-sm border">
                  <div className="aspect-[16/9] bg-muted relative">
                    <Link href={`/blog/${related.slug}`} className="absolute inset-0 z-10" />
                    {related.featuredImageUrl && (
                      <img src={related.featuredImageUrl} alt={related.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                  </div>
                  <div className="p-6">
                    {related.categoryName && (
                      <span className="text-xs font-bold text-primary tracking-wider uppercase mb-2 block">{related.categoryName}</span>
                    )}
                    <h3 className="font-serif font-bold text-xl leading-snug mb-3 group-hover:text-primary transition-colors">
                      <Link href={`/blog/${related.slug}`}>{related.title}</Link>
                    </h3>
                    <div className="text-sm text-muted-foreground">{formatDate(related.publishedAt || related.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
