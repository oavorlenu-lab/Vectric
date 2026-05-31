import { useParams } from "wouter";
import { Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListPosts, useGetCategoriesWithCounts } from "@workspace/api-client-react";
import { formatDate } from "@/lib/format";
import { AdSlot } from "@/components/AdSlot";

export default function Category() {
  const { slug } = useParams();

  const { data: categories } = useGetCategoriesWithCounts();
  const category = categories?.find(c => c.slug === slug);

  const { data: results, isLoading } = useListPosts(
    { category: slug, limit: 20 },
    { query: { enabled: !!slug } }
  );

  return (
    <PublicLayout>
      <div className="bg-muted border-b">
        <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 capitalize">
            {category?.name || slug?.replace(/-/g, " ")}
          </h1>
          {category?.description && (
            <p className="text-xl text-muted-foreground">{category.description}</p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl">
        <AdSlot position="category_top" />
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="w-full aspect-[4/3] bg-muted rounded-xl mb-4"></div>
                <div className="h-6 bg-muted w-3/4 mb-3 rounded"></div>
                <div className="h-4 bg-muted w-full mb-2 rounded"></div>
                <div className="h-4 bg-muted w-2/3 rounded"></div>
              </div>
            ))}
          </div>
        ) : results?.posts && results.posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16">
            {results.posts.map((post) => (
              <div key={post.id} className="group">
                {post.featuredImageUrl && (
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-muted relative mb-6">
                    <Link href={`/blog/${post.slug}`} className="absolute inset-0 z-10" />
                    <img
                      src={post.featuredImageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <h3 className="font-serif font-bold text-2xl leading-snug mb-3 group-hover:text-primary transition-colors">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                {post.excerpt && (
                  <p className="text-muted-foreground mb-4 line-clamp-3">{post.excerpt}</p>
                )}
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  {post.authorName && <span className="font-medium text-foreground">{post.authorName}</span>}
                  <span>•</span>
                  <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-serif font-medium text-muted-foreground">
              No posts found in this category
            </h2>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
