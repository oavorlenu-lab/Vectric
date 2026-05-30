import { useState } from "react";
import { useListPosts, useDeletePost } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Edit, Trash2, Plus, Search, Eye } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListPostsQueryKey } from "@workspace/api-client-react";

export default function AdminPosts() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft" | "scheduled">("all");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: results, isLoading } = useListPosts({
    search: search || undefined,
    status: status === "all" ? undefined : status,
    limit: 50,
  });

  const deletePost = useDeletePost();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePost.mutate({ id }, {
        onSuccess: () => {
          toast.success("Post deleted");
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        },
      });
    }
  };

  const getStatusBadge = (postStatus: string) => {
    switch (postStatus) {
      case "published": return <Badge className="bg-green-500 text-white text-xs">Published</Badge>;
      case "draft": return <Badge variant="secondary" className="text-xs">Draft</Badge>;
      case "scheduled": return <Badge variant="outline" className="text-blue-500 border-blue-300 text-xs">Scheduled</Badge>;
      default: return <Badge className="text-xs">{postStatus}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">Posts</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Manage your blog articles</p>
        </div>
        <Button onClick={() => setLocation("/admin/posts/new")} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-3 md:p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search posts..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={(val: any) => setStatus(val)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-medium text-gray-600 w-[42%]">Title</th>
              <th className="text-left p-3 font-medium text-gray-600">Status</th>
              <th className="text-left p-3 font-medium text-gray-600">Category</th>
              <th className="text-left p-3 font-medium text-gray-600">Date</th>
              <th className="text-left p-3 font-medium text-gray-600">Views</th>
              <th className="text-right p-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading posts…</td></tr>
            ) : results?.posts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No posts found</td></tr>
            ) : results?.posts.map(post => (
              <tr key={post.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <td className="p-3">
                  <div className="font-medium line-clamp-1">{post.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">/{post.slug}</div>
                </td>
                <td className="p-3">{getStatusBadge(post.status)}</td>
                <td className="p-3 text-gray-600">{post.categoryName || "—"}</td>
                <td className="p-3 text-gray-500">{formatDate(post.createdAt)}</td>
                <td className="p-3 text-gray-600">{post.viewCount ?? 0}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setLocation(`/admin/posts/${post.id}/edit`)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : results?.posts.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400">No posts found</div>
        ) : results?.posts.map(post => (
          <div key={post.id} className="bg-white rounded-xl border shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium line-clamp-2 text-sm">{post.title}</div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {getStatusBadge(post.status)}
                  {post.categoryName && (
                    <span className="text-xs text-gray-500">{post.categoryName}</span>
                  )}
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Eye className="w-3 h-3" />{post.viewCount ?? 0}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setLocation(`/admin/posts/${post.id}/edit`)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50" onClick={() => handleDelete(post.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
