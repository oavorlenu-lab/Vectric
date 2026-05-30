import { useState } from "react";
import { useLocation } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListPosts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatDate } from "@/lib/format";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Search() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  
  const { data: results, isLoading } = useListPosts(
    { search: activeQuery, limit: 20 },
    { query: { enabled: activeQuery.length > 0 } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setActiveQuery(query);
    window.history.replaceState({}, "", `/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl min-h-[60vh]">
        <h1 className="text-4xl font-serif font-bold mb-8 text-center">Search</h1>
        
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-12">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for articles, topics, or authors..."
            className="pl-12 py-6 text-lg rounded-full shadow-sm"
          />
        </form>

        {isLoading ? (
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-6 animate-pulse">
                <div className="w-1/3 aspect-[4/3] bg-muted rounded-xl"></div>
                <div className="flex-1 py-2">
                  <div className="h-4 bg-muted w-20 mb-4 rounded"></div>
                  <div className="h-6 bg-muted w-full mb-2 rounded"></div>
                  <div className="h-6 bg-muted w-3/4 mb-4 rounded"></div>
                  <div className="h-4 bg-muted w-1/2 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activeQuery && results?.posts.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-serif font-medium text-muted-foreground">No results found for "{activeQuery}"</h2>
            <p className="mt-2 text-muted-foreground">Try adjusting your search terms or exploring our categories.</p>
          </div>
        ) : results?.posts ? (
          <div className="space-y-10">
            <p className="text-muted-foreground border-b pb-4">
              Found {results.total} results for "{activeQuery}"
            </p>
            {results.posts.map(post => (
              <div key={post.id} className="flex flex-col md:flex-row gap-6 group">
                {post.featuredImageUrl && (
                  <div className="w-full md:w-1/3 aspect-[4/3] rounded-xl overflow-hidden bg-muted relative shrink-0">
                    <Link href={`/blog/${post.slug}`} className="absolute inset-0 z-10"></Link>
                    <img 
                      src={post.featuredImageUrl} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-center py-2">
                  {post.categoryName && (
                    <span className="text-xs font-bold text-primary tracking-wider uppercase mb-3">
                      {post.categoryName}
                    </span>
                  )}
                  <h3 className="font-serif font-bold text-2xl leading-snug mb-3 group-hover:text-primary transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  {post.excerpt && (
                    <p className="text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                  )}
                  <div className="text-sm text-muted-foreground flex items-center gap-2 mt-auto">
                    {post.authorName && <span className="font-medium text-foreground">{post.authorName}</span>}
                    <span>•</span>
                    <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </PublicLayout>
  );
}
