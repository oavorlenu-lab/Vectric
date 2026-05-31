import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListPosts, useGetCategoriesWithCounts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatDate } from "@/lib/format";
import { Search as SearchIcon, X, Loader2, Clock, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdSlot } from "@/components/AdSlot";

interface Suggestion {
  id: number;
  title: string;
  slug: string;
  featuredImageUrl: string | null;
  categoryName: string | null;
  excerpt: string | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function Search() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("vectric_recent_searches") || "[]"); } catch { return []; }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    fetch(`/api/posts/suggest?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then(data => {
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoadingSuggestions(false));
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: categories } = useGetCategoriesWithCounts();
  const { data: results, isLoading } = useListPosts(
    { search: activeQuery, status: "published", limit: 20 },
    { query: { enabled: activeQuery.length > 0 } }
  );

  const commitSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setActiveQuery(q.trim());
    setShowSuggestions(false);
    window.history.replaceState({}, "", `/search?q=${encodeURIComponent(q.trim())}`);
    // Save to recent searches
    setRecentSearches(prev => {
      const updated = [q.trim(), ...prev.filter(s => s !== q.trim())].slice(0, 5);
      localStorage.setItem("vectric_recent_searches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    commitSearch(query);
  };

  const handleSuggestionClick = (slug: string, title: string) => {
    setShowSuggestions(false);
    commitSearch(title);
  };

  const clearSearch = () => {
    setQuery("");
    setActiveQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    window.history.replaceState({}, "", "/search");
    inputRef.current?.focus();
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("vectric_recent_searches");
  };

  const filteredResults = categoryFilter
    ? results?.posts.filter(p => p.categoryName === categoryFilter)
    : results?.posts;

  const resultCategories = results
    ? [...new Set(results.posts.map(p => p.categoryName).filter(Boolean))]
    : [];

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-muted/60 to-background border-b pb-0">
        <div className="container mx-auto px-4 pt-12 pb-0 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-center mb-8">
            {activeQuery ? `Results for "${activeQuery}"` : "Search"}
          </h1>

          {/* Search input with autocomplete */}
          <div className="relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                {loadingSuggestions
                  ? <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
                  : <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                }
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => { if (query.length >= 2 && suggestions.length) setShowSuggestions(true); }}
                  placeholder="Search articles, topics, authors…"
                  className="pl-12 pr-24 py-6 text-base rounded-2xl shadow-sm border-2 focus-visible:ring-0 focus-visible:border-primary"
                  autoComplete="off"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {query && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={clearSearch}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  <Button type="submit" size="sm" className="rounded-xl h-8 px-3 text-xs font-bold">
                    Search
                  </Button>
                </div>
              </div>
            </form>

            {/* Autocomplete dropdown */}
            {showSuggestions && (query.length >= 2) && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-2xl shadow-xl z-50 overflow-hidden"
              >
                {suggestions.length === 0 && !loadingSuggestions ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No suggestions — press Enter to search
                  </div>
                ) : (
                  <ul>
                    {suggestions.map((s, i) => (
                      <li key={s.id}>
                        <Link
                          href={`/blog/${s.slug}`}
                          onClick={() => handleSuggestionClick(s.slug, s.title)}
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors cursor-pointer ${i > 0 ? "border-t" : ""}`}
                        >
                          <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                            {s.featuredImageUrl && (
                              <img src={s.featuredImageUrl} alt={s.title} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm line-clamp-1">{s.title}</div>
                            {s.categoryName && (
                              <div className="text-xs text-primary font-semibold mt-0.5">{s.categoryName}</div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </Link>
                      </li>
                    ))}
                    {/* Show "Search for..." option */}
                    <li className="border-t">
                      <button
                        className="flex items-center gap-3 px-4 py-3 w-full hover:bg-muted/60 transition-colors text-left"
                        onClick={() => commitSearch(query)}
                      >
                        <SearchIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm">Search for <strong>"{query}"</strong></span>
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Recent searches — shown when input is focused and empty */}
          {!activeQuery && !query && recentSearches.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 pb-6">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Recent:
              </span>
              {recentSearches.map(s => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); commitSearch(s); }}
                  className="text-xs px-3 py-1 bg-muted rounded-full hover:bg-muted/80 transition-colors"
                >
                  {s}
                </button>
              ))}
              <button onClick={clearRecent} className="text-xs text-muted-foreground hover:text-foreground ml-1">
                Clear
              </button>
            </div>
          )}
          <div className="h-8" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl min-h-[50vh]">
        {/* Results */}
        {activeQuery ? (
          <>
            {/* Category filter chips */}
            {resultCategories.length > 1 && !isLoading && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <button
                  onClick={() => setCategoryFilter(undefined)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${!categoryFilter ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                >
                  All ({results?.total ?? 0})
                </button>
                {resultCategories.map(cat => cat && (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat === categoryFilter ? undefined : cat)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${categoryFilter === cat ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="space-y-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-5 animate-pulse">
                    <div className="w-32 md:w-44 aspect-[4/3] bg-muted rounded-xl shrink-0"></div>
                    <div className="flex-1 py-2 space-y-3">
                      <div className="h-3 bg-muted w-20 rounded"></div>
                      <div className="h-5 bg-muted w-full rounded"></div>
                      <div className="h-5 bg-muted w-3/4 rounded"></div>
                      <div className="h-3 bg-muted w-1/3 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !filteredResults?.length ? (
              <div className="text-center py-24">
                <SearchIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-2xl font-serif font-medium text-muted-foreground mb-2">
                  No results for "{activeQuery}"
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Try different keywords or browse by category below.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {categories?.map(c => (
                    <Link key={c.id} href={`/category/${c.slug}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-muted">{c.name}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-6 border-b pb-4">
                  {filteredResults.length} article{filteredResults.length !== 1 ? "s" : ""}{" "}
                  {categoryFilter ? `in ${categoryFilter}` : `found for "${activeQuery}"`}
                </p>

                <div className="space-y-8">
                  {filteredResults.map((post, i) => (
                    <div key={post.id}>
                      <div className="flex flex-col sm:flex-row gap-5 group">
                        <div className="w-full sm:w-40 md:w-52 aspect-[16/9] sm:aspect-[4/3] rounded-xl overflow-hidden bg-muted relative shrink-0">
                          <Link href={`/blog/${post.slug}`} className="absolute inset-0 z-10" />
                          {post.featuredImageUrl ? (
                            <img
                              src={post.featuredImageUrl}
                              alt={post.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <SearchIcon className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-center py-1">
                          {post.categoryName && (
                            <Link href={`/category/${post.categoryName.toLowerCase().replace(/\s+/g, "-")}`}>
                              <span className="text-xs font-bold text-primary tracking-wider uppercase mb-2 block hover:underline">
                                {post.categoryName}
                              </span>
                            </Link>
                          )}
                          <h3 className="font-serif font-bold text-xl md:text-2xl leading-snug mb-2 group-hover:text-primary transition-colors">
                            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                          </h3>
                          {post.excerpt && (
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                          )}
                          <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                            {post.authorName && (
                              <span className="font-medium text-foreground">{post.authorName}</span>
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
                        </div>
                      </div>
                      {/* Insert ad after every 4th result */}
                      {(i + 1) % 4 === 0 && <AdSlot position="homepage_between_sections" />}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          /* Empty state — show categories to browse */
          <div className="text-center py-8">
            <p className="text-muted-foreground text-lg mb-8">Browse by category</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {categories?.map(cat => (
                <Link key={cat.id} href={`/category/${cat.slug}`}>
                  <div className="bg-muted/50 border hover:bg-muted hover:border-primary/30 transition-colors rounded-xl p-4 text-center cursor-pointer group">
                    <div className="font-serif font-bold group-hover:text-primary transition-colors">{cat.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{cat.postCount} articles</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
