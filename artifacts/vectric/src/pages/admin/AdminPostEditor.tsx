import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetPost, useCreatePost, useUpdatePost, useListCategories, useListTags } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon, Save, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListPostsQueryKey, getGetPostQueryKey } from "@workspace/api-client-react";

export default function AdminPostEditor() {
  const { id } = useParams();
  const isEdit = !!id;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: post, isLoading: postLoading } = useGetPost(Number(id), {
    query: { enabled: isEdit }
  });
  
  const { data: categories } = useListCategories();
  
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [authorName, setAuthorName] = useState("");
  const [readingTime, setReadingTime] = useState<number>(5);
  const [status, setStatus] = useState<"published" | "draft" | "scheduled">("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [ctaButtonsStr, setCtaButtonsStr] = useState("[]");

  const editorRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (isEdit && post && !initialized.current) {
      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt || "");
      setContent(post.content);
      setCategoryId(post.categoryId || "");
      setAuthorName(post.authorName || "");
      setReadingTime(post.readingTime || 5);
      setStatus(post.status as any);
      setIsFeatured(post.isFeatured || false);
      setFeaturedImageUrl(post.featuredImageUrl || "");
      setSeoTitle(post.seoTitle || "");
      setSeoDescription(post.seoDescription || "");
      setSeoKeywords(post.seoKeywords || "");
      setScheduledAt(post.scheduledAt || "");
      setCtaButtonsStr(post.ctaButtons || "[]");
      
      if (editorRef.current) {
        editorRef.current.innerHTML = post.content;
      }
      initialized.current = true;
    }
  }, [post, isEdit]);

  // Generate slug from title
  useEffect(() => {
    if (!isEdit && title && !slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  }, [title, isEdit, slug]);

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    handleEditorInput();
    editorRef.current?.focus();
  };

  const handleSave = () => {
    if (!title || !content) {
      toast.error("Title and content are required");
      return;
    }

    const payload = {
      title,
      slug: slug || undefined,
      excerpt,
      content,
      categoryId: categoryId === "" ? undefined : Number(categoryId),
      authorName,
      readingTime: Number(readingTime),
      status,
      isFeatured,
      featuredImageUrl,
      seoTitle,
      seoDescription,
      seoKeywords,
      scheduledAt: status === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      ctaButtons: ctaButtonsStr,
    };

    if (isEdit) {
      updatePost.mutate(
        { id: Number(id), data: payload },
        {
          onSuccess: (data) => {
            toast.success("Post updated");
            queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(Number(id)) });
          },
          onError: () => toast.error("Failed to update post")
        }
      );
    } else {
      createPost.mutate(
        { data: payload as any },
        {
          onSuccess: () => {
            toast.success("Post created");
            queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
            setLocation("/admin/posts");
          },
          onError: () => toast.error("Failed to create post")
        }
      );
    }
  };

  if (isEdit && postLoading) return <AdminLayout><div>Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/posts")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900">{isEdit ? "Edit Post" : "New Post"}</h1>
          </div>
        </div>
        <Button onClick={handleSave} disabled={createPost.isPending || updatePost.isPending}>
          <Save className="w-4 h-4 mr-2" />
          Save Post
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} className="text-lg font-serif" placeholder="Enter post title" />
            </div>
            <div>
              <Label>Excerpt</Label>
              <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Brief summary of the post" rows={3} />
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("bold")}><Bold className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("italic")}><Italic className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("underline")}><Underline className="w-4 h-4" /></Button>
                <div className="w-px h-6 bg-gray-300 mx-1 my-auto"></div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("formatBlock", "H2")}><Heading2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("formatBlock", "H3")}><Heading3 className="w-4 h-4" /></Button>
                <div className="w-px h-6 bg-gray-300 mx-1 my-auto"></div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("insertUnorderedList")}><List className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("insertOrderedList")}><ListOrdered className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("formatBlock", "BLOCKQUOTE")}><Quote className="w-4 h-4" /></Button>
                <div className="w-px h-6 bg-gray-300 mx-1 my-auto"></div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                  const url = prompt("Enter link URL:");
                  if (url) execCommand("createLink", url);
                }}><LinkIcon className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                  const url = prompt("Enter image URL:");
                  if (url) execCommand("insertImage", url);
                }}><ImageIcon className="w-4 h-4" /></Button>
              </div>
              <div 
                ref={editorRef}
                className="p-4 min-h-[500px] prose max-w-none focus:outline-none"
                contentEditable
                onInput={handleEditorInput}
                onBlur={handleEditorInput}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-2">SEO Settings</h3>
            <div>
              <Label>SEO Title</Label>
              <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} />
            </div>
            <div>
              <Label>SEO Description</Label>
              <Textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Keywords</Label>
              <Input value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} placeholder="Comma separated keywords" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-2">Publishing</h3>
            
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === "scheduled" && (
              <div>
                <Label>Schedule Date</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              </div>
            )}

            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} />
            </div>

            <div className="flex items-center justify-between">
              <Label>Featured Post</Label>
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-2">Meta</h3>
            
            <div>
              <Label>Category</Label>
              <Select value={categoryId.toString()} onValueChange={(val) => setCategoryId(val ? Number(val) : "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Author Name</Label>
              <Input value={authorName} onChange={e => setAuthorName(e.target.value)} />
            </div>

            <div>
              <Label>Reading Time (min)</Label>
              <Input type="number" min="1" value={readingTime} onChange={e => setReadingTime(Number(e.target.value))} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-2">Featured Image</h3>
            <div>
              <Input placeholder="Image URL" value={featuredImageUrl} onChange={e => setFeaturedImageUrl(e.target.value)} />
            </div>
            {featuredImageUrl && (
              <div className="aspect-video rounded bg-gray-100 overflow-hidden">
                <img src={featuredImageUrl} alt="Featured" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
