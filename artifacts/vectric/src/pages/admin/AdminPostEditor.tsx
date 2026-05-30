import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetPost, useCreatePost, useUpdatePost, useListCategories } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered,
  Quote, Link as LinkIcon, Image as ImageIcon, Save, ArrowLeft,
  Upload, X, Loader2
} from "lucide-react";
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
  const [imageUploading, setImageUploading] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (!isEdit && title && !slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
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

  const handleImageUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    setImageUploading(true);
    try {
      const resp = await fetch("/api/media", {
        method: "POST",
        body: fd,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const data = await resp.json();
      setFeaturedImageUrl(data.url);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleInsertImageInEditor = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("file", file);
      const toastId = toast.loading("Uploading image…");
      try {
        const resp = await fetch("/api/media", { method: "POST", body: fd });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Failed");
        execCommand("insertImage", data.url);
        toast.success("Image inserted", { id: toastId });
      } catch (err: any) {
        toast.error(err.message, { id: toastId });
      }
    };
    input.click();
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
          onSuccess: () => {
            toast.success("Post updated");
            queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(Number(id)) });
          },
          onError: () => toast.error("Failed to update post"),
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
          onError: () => toast.error("Failed to create post"),
        }
      );
    }
  };

  if (isEdit && postLoading) return <AdminLayout><div className="animate-pulse h-96 bg-gray-100 rounded-xl" /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/posts")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            {isEdit ? "Edit Post" : "New Post"}
          </h1>
        </div>
        <Button onClick={handleSave} disabled={createPost.isPending || updatePost.isPending}>
          {(createPost.isPending || updatePost.isPending)
            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            : <Save className="w-4 h-4 mr-2" />}
          Save Post
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white p-4 md:p-6 rounded-xl border shadow-sm space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="text-lg font-serif mt-1"
                placeholder="Enter post title"
              />
            </div>
            <div>
              <Label>Excerpt</Label>
              <Textarea
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                placeholder="Brief summary of the post"
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Rich text editor */}
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("bold")} title="Bold"><Bold className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("italic")} title="Italic"><Italic className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("underline")} title="Underline"><Underline className="w-4 h-4" /></Button>
                <div className="w-px h-6 bg-gray-300 mx-1 my-auto" />
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("formatBlock", "H2")} title="Heading 2"><Heading2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("formatBlock", "H3")} title="Heading 3"><Heading3 className="w-4 h-4" /></Button>
                <div className="w-px h-6 bg-gray-300 mx-1 my-auto" />
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("insertUnorderedList")} title="Bullet list"><List className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("insertOrderedList")} title="Numbered list"><ListOrdered className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("formatBlock", "BLOCKQUOTE")} title="Quote"><Quote className="w-4 h-4" /></Button>
                <div className="w-px h-6 bg-gray-300 mx-1 my-auto" />
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Insert link" onClick={() => {
                  const url = prompt("Enter link URL:");
                  if (url) execCommand("createLink", url);
                }}><LinkIcon className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Insert image from device" onClick={handleInsertImageInEditor}>
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
              <div
                ref={editorRef}
                className="p-4 min-h-[400px] md:min-h-[500px] prose max-w-none focus:outline-none text-base"
                contentEditable
                onInput={handleEditorInput}
                onBlur={handleEditorInput}
              />
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white p-4 md:p-6 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-2">SEO Settings</h3>
            <div>
              <Label>SEO Title</Label>
              <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>SEO Description</Label>
              <Textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={2} className="mt-1" />
            </div>
            <div>
              <Label>Keywords</Label>
              <Input value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} placeholder="Comma separated" className="mt-1" />
            </div>
          </div>
        </div>

        {/* Sidebar panel */}
        <div className="space-y-5">
          {/* Publishing */}
          <div className="bg-white p-4 md:p-5 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-2">Publishing</h3>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger className="mt-1">
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
                <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="mt-1" />
              </div>
            )}

            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} className="mt-1 text-sm font-mono" />
            </div>

            <div className="flex items-center justify-between pt-1">
              <Label>Featured Post</Label>
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
          </div>

          {/* Meta */}
          <div className="bg-white p-4 md:p-5 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-2">Meta</h3>
            <div>
              <Label>Category</Label>
              <Select value={categoryId.toString()} onValueChange={(val) => setCategoryId(val ? Number(val) : "")}>
                <SelectTrigger className="mt-1">
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
              <Input value={authorName} onChange={e => setAuthorName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Reading Time (min)</Label>
              <Input type="number" min="1" value={readingTime} onChange={e => setReadingTime(Number(e.target.value))} className="mt-1" />
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white p-4 md:p-5 rounded-xl border shadow-sm space-y-3">
            <h3 className="font-bold border-b pb-2">Featured Image</h3>

            {/* Upload from device */}
            <input
              type="file"
              ref={imageInputRef}
              className="hidden"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={imageUploading}
              onClick={() => imageInputRef.current?.click()}
            >
              {imageUploading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</>
                : <><Upload className="w-4 h-4 mr-2" /> Upload from device</>}
            </Button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              <span>or paste URL</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="relative">
              <Input
                placeholder="https://example.com/image.jpg"
                value={featuredImageUrl}
                onChange={e => setFeaturedImageUrl(e.target.value)}
                className="pr-8"
              />
              {featuredImageUrl && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setFeaturedImageUrl("")}
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {featuredImageUrl && (
              <div className="aspect-video rounded-lg bg-gray-100 overflow-hidden border">
                <img src={featuredImageUrl} alt="Featured" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
