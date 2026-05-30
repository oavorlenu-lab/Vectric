import { useState } from "react";
import { useAiGenerate } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Wand2, Copy } from "lucide-react";

export default function AdminAi() {
  const [action, setAction] = useState<any>("generate");
  const [prompt, setPrompt] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [result, setResult] = useState("");
  
  const generate = useAiGenerate();

  const handleGenerate = () => {
    if (!prompt && action !== "suggest_tags" && action !== "seo_title" && action !== "seo_description") {
      toast.error("Prompt is required for this action");
      return;
    }

    generate.mutate(
      { data: { action, prompt, existingContent: existingContent || undefined } },
      {
        onSuccess: (res) => {
          setResult(res.result);
          toast.success("Generation complete");
        },
        onError: () => toast.error("Failed to generate content. Check API key in settings.")
      }
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard");
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900">AI Writing Assistant</h1>
        <p className="text-gray-500 mt-1">Powered by Grok. Configure your API key in Settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="generate">Generate New Content</SelectItem>
                <SelectItem value="expand">Expand Existing</SelectItem>
                <SelectItem value="rewrite">Rewrite/Improve</SelectItem>
                <SelectItem value="summarize">Summarize</SelectItem>
                <SelectItem value="seo_title">Generate SEO Title</SelectItem>
                <SelectItem value="seo_description">Generate SEO Description</SelectItem>
                <SelectItem value="suggest_tags">Suggest Tags</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Prompt / Instructions</Label>
            <Textarea 
              value={prompt} 
              onChange={e => setPrompt(e.target.value)} 
              placeholder="E.g., Write an introduction for an article about the future of AI in healthcare..."
              rows={3}
            />
          </div>

          {(action === "expand" || action === "rewrite" || action === "summarize" || action === "seo_description" || action === "suggest_tags") && (
            <div className="space-y-2">
              <Label>Source Content</Label>
              <Textarea 
                value={existingContent} 
                onChange={e => setExistingContent(e.target.value)} 
                placeholder="Paste the content you want the AI to work with..."
                rows={6}
              />
            </div>
          )}

          <Button onClick={handleGenerate} disabled={generate.isPending} className="w-full">
            <Wand2 className="w-4 h-4 mr-2" />
            {generate.isPending ? "Generating..." : "Generate"}
          </Button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <Label className="text-lg">Result</Label>
            {result && (
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            )}
          </div>
          
          <div className="flex-1 bg-gray-50 rounded-md p-4 min-h-[300px] overflow-y-auto whitespace-pre-wrap font-serif text-gray-800">
            {result || <span className="text-gray-400 italic text-sm">Generated content will appear here...</span>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
