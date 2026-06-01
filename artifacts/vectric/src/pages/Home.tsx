import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetTrendingPosts, useGetFeaturedPosts, useGetRecentPosts, useGetCategoriesWithCounts, useSubscribeNewsletter } from "@workspace/api-client-react";
import { AdSlot } from "@/components/AdSlot";
import { formatDate } from "@/lib/format";
import { ArrowRight, ChevronRight, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layout/PublicLayout";

const SUBSCRIBED_KEY = "vectric_subscribed";

export default function Homepage() {
  const { data: featuredPosts } = useGetFeaturedPosts({ limit: 4 });
  const { data: trendingPosts } = useGetTrendingPosts({ limit: 5 });
  const { data: recentPosts } = useGetRecentPosts({ limit: 6 });
  const { data: categories } = useGetCategoriesWithCounts();

  const subscribe = useSubscribeNewsletter();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(() => !!localStorage.getItem(SUBSCRIBED_KEY));

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    subscribe.mutate({ data: { email } }, {
      onSuccess: () => {
        localStorage.setItem(SUBSCRIBED_KEY, "true");
        setSubscribed(true);
        setEmail("");
        toast.success("You're subscribed! Welcome aboard.");
      },
      onError: () => toast.error("Failed to subscribe. Please try again."),
    });
  };

  const heroPost = featuredPosts?.[0];
  const subFeatured = featuredPosts?.slice(1, 4) || [];

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-6 md:py-8">

        {/* Hero Section */}
        {heroPost && (
          <section className="mb-10 md:mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">

              {/* Main hero card */}
              <div className="lg:col-span-8">
                <div className="group relative overflow-hidden rounded-xl bg-muted w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto lg:h-[520px]">
                  <Link href={`/blog/${heroPost.slug}`} className="absolute inset-0 z-10" />
                  {heroPost.featuredImageUrl ? (
                    <img
                      src={heroPost.featuredImageUrl}
                      alt={heroPost.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-600" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 p-5 md:p-8 w-full pointer-events-none">
                    {heroPost.categoryName && (
                      <span className="inline-block px-3 py-1 mb-3 text-xs font-bold tracking-wider uppercase bg-primary text-primary-foreground rounded-full">
                        {heroPost.categoryName}
                      </span>
                    )}
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-3 leading-tight">
                      {heroPost.title}
                    </h1>
                    {heroPost.excerpt && (
                      <p className="text-gray-200 text-base line-clamp-2 mb-3 hidden sm:block">
                        {heroPost.excerpt}
                      </p>
                    )}
                    <div className="flex items-center text-gray-300 text-sm gap-3 flex-wrap">
                      {heroPost.authorName && <span>By {heroPost.authorName}</span>}
                      <span>{formatDate(heroPost.publishedAt || heroPost.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-featured posts */}
              {subFeatured.length > 0 && (
                <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
                  {subFeatured.map((post) => (
                    <div key={post.id} className="flex gap-3 group">
                      <div className="w-24 sm:w-20 lg:w-28 aspect-[4/3] rounded-lg overflow-hidden bg-muted relative shrink-0">
                        <Link href={`/blog/${post.slug}`} className="absolute inset-0 z-10" />
                        {post.featuredImageUrl ? (
                          <img
                            src={post.featuredImageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        {post.categoryName && (
                          <span className="text-xs font-bold text-primary tracking-wider uppercase mb-1">
                            {post.categoryName}
                          </span>
                        )}
                        <h3 className="font-serif font-bold text-sm md:text-base leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-3">
                          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                        </h3>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(post.publishedAt || post.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <AdSlot position="homepage_below_hero" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 md:mt-12">

          {/* Main Content Column */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6 pb-3 border-b">
              <h2 className="text-2xl md:text-3xl font-serif font-bold">Latest Stories</h2>
              <Link href="/search" className="text-sm font-medium flex items-center gap-1 text-primary hover:underline">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {recentPosts?.map(post => (
                <div key={post.id} className="group">
                  <div className="aspect-[16/9] rounded-xl overflow-hidden bg-muted mb-3 relative">
                    <Link href={`/blog/${post.slug}`} className="absolute inset-0 z-10" />
                    {post.featuredImageUrl ? (
                      <img
                        src={post.featuredImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                    )}
                  </div>
                  {post.categoryName && (
                    <span className="text-xs font-bold text-primary tracking-wider uppercase">
                      {post.categoryName}
                    </span>
                  )}
                  <h3 className="text-lg md:text-xl font-serif font-bold leading-snug mt-1 mb-2 group-hover:text-primary transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  {post.excerpt && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground gap-2 flex-wrap">
                    {post.authorName && <span className="font-medium text-foreground">{post.authorName}</span>}
                    <span>•</span>
                    <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>

            <AdSlot position="homepage_between_sections" />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-10">

            {/* Trending */}
            <div>
              <h2 className="text-lg font-bold mb-5 pb-2 border-b uppercase tracking-wider">Trending Now</h2>
              <div className="space-y-5">
                {trendingPosts?.map((post, i) => (
                  <div key={post.id} className="flex gap-3 group">
                    <div className="text-3xl font-serif font-bold text-muted/40 shrink-0 w-7 leading-none pt-1">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        {post.categoryName && <span>{post.categoryName}</span>}
                        <span>•</span>
                        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-primary/5 rounded-xl p-6 text-center border border-primary/10">
              {subscribed ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-serif font-bold mb-2">You're subscribed!</h3>
                  <p className="text-muted-foreground text-sm">
                    Thank you for subscribing. You'll receive our best stories straight to your inbox.
                  </p>
                </>
              ) : (
                <>
                  <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-serif font-bold mb-2">The Newsletter</h3>
                  <p className="text-muted-foreground text-sm mb-5">
                    Get our best stories delivered to your inbox every week.
                  </p>
                  <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                    <input
                      type="email"
                      placeholder="Your email address"
                      className="px-4 py-2.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                    <Button type="submit" disabled={subscribe.isPending} className="w-full font-bold">
                      {subscribe.isPending ? "Subscribing…" : "Subscribe"}
                    </Button>
                  </form>
                </>
              )}
            </div>

            {/* Categories */}
            <div>
              <h2 className="text-lg font-bold mb-5 pb-2 border-b uppercase tracking-wider">Explore</h2>
              <div className="space-y-1">
                {categories?.map(category => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="flex items-center justify-between py-2 group hover:text-primary transition-colors"
                  >
                    <span className="font-medium">{category.name}</span>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <span className="mr-1">{category.postCount}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>

        <AdSlot position="homepage_above_footer" />
      </div>
    </PublicLayout>
  );
}
