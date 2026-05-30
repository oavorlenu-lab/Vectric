import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetTrendingPosts, useGetFeaturedPosts, useGetRecentPosts, useGetCategoriesWithCounts, useSubscribeNewsletter } from "@workspace/api-client-react";
import { AdSlot } from "@/components/AdSlot";
import { formatDate } from "@/lib/format";
import { ArrowRight, ChevronRight, Mail } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function Homepage() {
  const { data: featuredPosts } = useGetFeaturedPosts({ limit: 4 });
  const { data: trendingPosts } = useGetTrendingPosts({ limit: 5 });
  const { data: recentPosts } = useGetRecentPosts({ limit: 6 });
  const { data: categories } = useGetCategoriesWithCounts();
  
  const subscribe = useSubscribeNewsletter();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    subscribe.mutate({ data: { email } }, {
      onSuccess: () => {
        toast.success("Subscribed successfully!");
        setEmail("");
      },
      onError: () => {
        toast.error("Failed to subscribe. Please try again.");
      }
    });
  };

  const heroPost = featuredPosts?.[0];
  const subFeatured = featuredPosts?.slice(1, 4) || [];

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        
        {/* Hero Section */}
        {heroPost && (
          <section className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 group relative overflow-hidden rounded-xl bg-muted aspect-video md:aspect-[2/1] lg:aspect-auto lg:h-[600px]">
                <Link href={`/blog/${heroPost.slug}`} className="block w-full h-full absolute inset-0 z-10"></Link>
                {heroPost.featuredImageUrl ? (
                  <img 
                    src={heroPost.featuredImageUrl} 
                    alt={heroPost.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-3/4 pointer-events-none">
                  {heroPost.categoryName && (
                    <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider uppercase bg-primary text-primary-foreground rounded-full">
                      {heroPost.categoryName}
                    </span>
                  )}
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-4 leading-tight">
                    {heroPost.title}
                  </h1>
                  {heroPost.excerpt && (
                    <p className="text-gray-200 text-lg line-clamp-2 mb-4 hidden md:block">
                      {heroPost.excerpt}
                    </p>
                  )}
                  <div className="flex items-center text-gray-300 text-sm gap-4">
                    {heroPost.authorName && <span>By {heroPost.authorName}</span>}
                    <span>{formatDate(heroPost.publishedAt || heroPost.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-6">
                {subFeatured.map((post) => (
                  <div key={post.id} className="flex gap-4 group h-full">
                    <div className="w-1/3 md:w-1/4 lg:w-1/3 aspect-[4/3] rounded-lg overflow-hidden bg-muted relative shrink-0">
                      <Link href={`/blog/${post.slug}`} className="absolute inset-0 z-10"></Link>
                      {post.featuredImageUrl && (
                        <img 
                          src={post.featuredImageUrl} 
                          alt={post.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      {post.categoryName && (
                        <span className="text-xs font-bold text-primary tracking-wider uppercase mb-2">
                          {post.categoryName}
                        </span>
                      )}
                      <h3 className="font-serif font-bold text-lg leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-3">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <div className="text-xs text-muted-foreground mt-auto">
                        {formatDate(post.publishedAt || post.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <AdSlot position="homepage_below_hero" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-16">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b">
              <h2 className="text-3xl font-serif font-bold">Latest Stories</h2>
              <Link href="/search" className="text-sm font-medium flex items-center gap-1 text-primary hover:underline">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recentPosts?.map(post => (
                <div key={post.id} className="group">
                  <div className="aspect-[16/9] rounded-xl overflow-hidden bg-muted mb-4 relative">
                    <Link href={`/blog/${post.slug}`} className="absolute inset-0 z-10"></Link>
                    {post.featuredImageUrl && (
                      <img 
                        src={post.featuredImageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  {post.categoryName && (
                    <div className="mb-2">
                      <span className="text-xs font-bold text-primary tracking-wider uppercase">
                        {post.categoryName}
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-serif font-bold leading-snug mb-3 group-hover:text-primary transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  {post.excerpt && (
                    <p className="text-muted-foreground line-clamp-2 mb-4">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground gap-3">
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
          <div className="lg:col-span-4 space-y-12">
            
            {/* Trending */}
            <div>
              <h2 className="text-xl font-bold mb-6 pb-2 border-b uppercase tracking-wider">Trending Now</h2>
              <div className="space-y-6">
                {trendingPosts?.map((post, i) => (
                  <div key={post.id} className="flex gap-4 group">
                    <div className="text-4xl font-serif font-bold text-muted/40 shrink-0 w-8">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
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
            <div className="bg-primary/5 rounded-xl p-8 text-center border border-primary/10">
              <Mail className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold mb-2">The Vectric Newsletter</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Get our best stories delivered to your inbox every week. No spam, just excellence.
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="px-4 py-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" disabled={subscribe.isPending} className="w-full font-bold">
                  Subscribe
                </Button>
              </form>
            </div>

            {/* Categories */}
            <div>
              <h2 className="text-xl font-bold mb-6 pb-2 border-b uppercase tracking-wider">Explore</h2>
              <div className="space-y-2">
                {categories?.map(category => (
                  <Link 
                    key={category.id} 
                    href={`/category/${category.slug}`}
                    className="flex items-center justify-between py-2 group hover:text-primary transition-colors"
                  >
                    <span className="font-medium">{category.name}</span>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <span className="mr-2">{category.postCount}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
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
