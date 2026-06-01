import { useState } from "react";
import { useGetPostBySlug, useIncrementPostView, useListRelatedPosts } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SeoHead } from "@/components/SeoHead";
import { formatDate } from "@/lib/format";
import { AdSlot } from "@/components/AdSlot";
import { Button } from "@/components/ui/button";
import { Twitter, Facebook, Linkedin, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function BlogPost() {
  const { slug } = useParams();
  const [viewTracked, setViewTracked] = useState(false);
  
  const { data: post, isLoading } = useGetPostBySlug(slug || "", {
    query: { enabled: !!slug }
  });
  
  const { data: relatedPosts } = useListRelatedPosts(post?.id || 0, {
    query: { enabled: !!post?.id }
  });
  
  const incrementView = useIncrementPostView();

  useEffect(() => {
    if (post?.id && !viewTracked) {
      incrementView.mutate({ id: post.id });
      setViewTracked(true);
    }
  }, [post?.id, viewTracked, incrementView]);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-16 max-w-4xl animate-pulse">
          <div className="w-24 h-6 bg-muted rounded mb-6"></div>
          <div className="w-full h-16 bg-muted rounded mb-4"></div>
          <div className="w-3/4 h-16 bg-muted rounded mb-8"></div>
          <div className="w-full aspect-[2/1] bg-muted rounded-xl mb-12"></div>
          <div className="space-y-4">
            <div className="w-full h-4 bg-muted rounded"></div>
            <div className="w-full h-4 bg-muted rounded"></div>
            <div className="w-5/6 h-4 bg-muted rounded"></div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!post) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist or has been removed.</p>
          <Button asChild><Link href="/">Return Home</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  let ctaButtons = [];
  try {
    if (post.ctaButtons) {
      ctaButtons = JSON.parse(post.ctaButtons);
    }
  } catch(e) {}

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  // Generate simple TOC from HTML if present
  const extractHeadings = (html: string) => {
    const headings: {id: string, text: string, level: number}[] = [];
    if (typeof DOMParser !== 'undefined') {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const els = doc.querySelectorAll('h2, h3');
      els.forEach((el, index) => {
        const id = el.id || `heading-${index}`;
        el.id = id; // mutates the DOM tree representing the HTML, but we won't use it to render
        headings.push({
          id,
          text: el.textContent || "",
          level: el.tagName === 'H2' ? 2 : 3
        });
      });
    }
    return headings;
  };

  const headings = extractHeadings(post.content);

  // Auto-add IDs to content headings so TOC links work
  let contentWithIds = post.content;
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(post.content, "text/html");
    const els = doc.querySelectorAll('h2, h3');
    els.forEach((el, index) => {
      if (!el.id) el.id = `heading-${index}`;
    });
    contentWithIds = doc.body.innerHTML;
  }

  const categorySlug = post.categoryName
    ? post.categoryName.toLowerCase().replace(/\s+/g, "-")
    : null;

  const breadcrumbs = [
    { name: "Home", url: "/" },
    ...(post.categoryName && categorySlug
      ? [{ name: post.categoryName, url: `/category/${categorySlug}` }]
      : []),
    { name: post.seoTitle || post.title, url: `/blog/${post.slug}` },
  ];

  return (
    <PublicLayout>
      <SeoHead
        title={post.seoTitle || post.title}
        description={post.seoDescription || post.excerpt || undefined}
        image={post.featuredImageUrl}
        type="article"
        article={{
          publishedAt: post.publishedAt || post.createdAt,
          updatedAt: post.updatedAt,
          authorName: post.authorName,
          tags: post.tags,
        }}
        breadcrumbs={breadcrumbs}
      />
      <article className="pb-20">
        <header className="container mx-auto px-4 pt-16 pb-12 max-w-4xl text-center">
          {post.categoryName && (
            <Link 
              href={`/category/${post.categoryName.toLowerCase().replace(/\s+/g, '-')}`}
              className="inline-block text-sm font-bold text-primary tracking-wider uppercase mb-6 hover:underline"
            >
              {post.categoryName}
            </Link>
          )}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 leading-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center justify-center gap-4 text-sm font-medium text-muted-foreground">
            {post.authorName && (
              <span className="text-foreground">By {post.authorName}</span>
            )}
            <span>•</span>
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            {post.readingTime && (
              <>
                <span>•</span>
                <span>{post.readingTime} min read</span>
              </>
            )}
          </div>
        </header>

        {post.featuredImageUrl && (
          <div className="container mx-auto px-4 max-w-5xl mb-16">
            <div className="aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden bg-muted w-full">
              <img 
                src={post.featuredImageUrl} 
                alt={post.title} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Sidebar with TOC and share */}
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
                      {headings.map(heading => (
                        <li key={heading.id} className={`${heading.level === 3 ? 'pl-4' : ''}`}>
                          <a href={`#${heading.id}`} className="text-muted-foreground hover:text-primary transition-colors block line-clamp-2">
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <AdSlot position="article_sidebar" />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 order-1 lg:order-2 max-w-3xl">
              <AdSlot position="article_after_intro" />
              
              <div 
                className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-bold prose-p:leading-relaxed prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl"
                dangerouslySetInnerHTML={{ __html: contentWithIds }}
              />

              <AdSlot position="article_mid_content" />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t">
                  {post.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA Buttons */}
              {ctaButtons.length > 0 && (
                <div className="mt-12 flex flex-wrap gap-4 justify-center bg-muted/50 p-8 rounded-2xl border">
                  {ctaButtons.map((btn: any, i: number) => (
                    <Button 
                      key={i} 
                      asChild 
                      variant={btn.style === 'outline' ? 'outline' : 'default'}
                      size="lg"
                    >
                      <a href={btn.url} target="_blank" rel="noopener noreferrer">{btn.text}</a>
                    </Button>
                  ))}
                </div>
              )}
              
              <AdSlot position="article_end" />
            </div>
            
            {/* Empty right column for balance */}
            <div className="hidden xl:block w-32 shrink-0 order-3"></div>
          </div>
        </div>
      </article>

      <AdSlot position="article_before_related" />

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="bg-muted py-16 border-t">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-serif font-bold mb-10 text-center">Read Next</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map(related => (
                <div key={related.id} className="group bg-card rounded-xl overflow-hidden shadow-sm border">
                  <div className="aspect-[16/9] bg-muted relative">
                    <Link href={`/blog/${related.slug}`} className="absolute inset-0 z-10"></Link>
                    {related.featuredImageUrl && (
                      <img 
                        src={related.featuredImageUrl} 
                        alt={related.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-6">
                    {related.categoryName && (
                      <span className="text-xs font-bold text-primary tracking-wider uppercase mb-2 block">
                        {related.categoryName}
                      </span>
                    )}
                    <h3 className="font-serif font-bold text-xl leading-snug mb-3 group-hover:text-primary transition-colors">
                      <Link href={`/blog/${related.slug}`}>{related.title}</Link>
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(related.publishedAt || related.createdAt)}
                    </div>
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
