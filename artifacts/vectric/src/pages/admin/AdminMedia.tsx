import { useState, useRef } from "react";
import { useListMedia, useUploadMedia, useDeleteMedia } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Trash2, Copy, FileIcon, ImageIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListMediaQueryKey } from "@workspace/api-client-react";
import { formatDate } from "@/lib/format";

export default function AdminMedia() {
  const queryClient = useQueryClient();
  const { data: mediaData, isLoading } = useListMedia({ limit: 100 });
  
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fd = new FormData();
      fd.append('file', file);
      
      uploadMedia.mutate(
        { data: fd as any },
        {
          onSuccess: () => {
            toast.success("File uploaded");
            queryClient.invalidateQueries({ queryKey: getListMediaQueryKey() });
            if (fileInputRef.current) fileInputRef.current.value = "";
          },
          onError: () => toast.error("Failed to upload file")
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this file? It might break images in your posts.")) {
      deleteMedia.mutate(
        { id },
        {
          onSuccess: () => {
            toast.success("File deleted");
            queryClient.invalidateQueries({ queryKey: getListMediaQueryKey() });
          }
        }
      );
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-500 mt-1">Manage your uploaded images</p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploadMedia.isPending}>
            <Upload className="w-4 h-4 mr-2" />
            {uploadMedia.isPending ? "Uploading..." : "Upload Image"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse"></div>)}
        </div>
      ) : mediaData?.media.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No media yet</h3>
          <p className="text-gray-500 mt-1 mb-4">Upload images to use them in your posts</p>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Upload Image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mediaData?.media.map((file) => (
            <div key={file.id} className="group relative bg-white rounded-xl border shadow-sm overflow-hidden aspect-square flex flex-col">
              <div className="flex-1 bg-gray-50 flex items-center justify-center p-2 relative">
                {file.mimeType?.startsWith('image/') ? (
                  <img src={file.url} alt={file.filename} className="max-w-full max-h-full object-contain" />
                ) : (
                  <FileIcon className="w-12 h-12 text-gray-300" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => copyUrl(file.url)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => handleDelete(file.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-2 border-t text-xs">
                <div className="truncate font-medium" title={file.originalName || file.filename}>
                  {file.originalName || file.filename}
                </div>
                <div className="flex justify-between text-gray-500 mt-1">
                  <span>{formatSize(file.size)}</span>
                  <span>{formatDate(file.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
