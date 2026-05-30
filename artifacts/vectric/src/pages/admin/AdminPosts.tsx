import { useState } from "react";
import { useListPosts, useDeletePost } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Edit, Trash2, Plus, Search } from "lucide-react";
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
    limit: 50
  });

  const deletePost = useDeletePost();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePost.mutate({ id }, {
        onSuccess: () => {
          toast.success("Post deleted");
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        }
      });
    }
  };

  const getStatusBadge = (postStatus: string) => {
    switch (postStatus) {
      case "published": return <Badge variant="default" className="bg-green-500">Published</Badge>;
      case "draft": return <Badge variant="secondary">Draft</Badge>;
      case "scheduled": return <Badge variant="outline" className="text-blue-500 border-blue-500">Scheduled</Badge>;
      default: return <Badge>{postStatus}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Posts</h1>
          <p className="text-gray-500 mt-1">Manage your blog articles</p>
        </div>
        <Button onClick={() => setLocation("/admin/posts/new")}>
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search posts..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={(val: any) => setStatus(val)}>
          <SelectTrigger className="w-[180px]">
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

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Views</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading posts...</TableCell>
              </TableRow>
            ) : results?.posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">No posts found</TableCell>
              </TableRow>
            ) : (
              results?.posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="line-clamp-1">{post.title}</span>
                      <span className="text-xs text-gray-500 font-normal mt-1">/{post.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell>{post.categoryName || "Uncategorized"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(post.createdAt)}</TableCell>
                  <TableCell>{post.viewCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setLocation(`/admin/posts/${post.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
