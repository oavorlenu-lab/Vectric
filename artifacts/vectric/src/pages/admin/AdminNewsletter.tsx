import { useState } from "react";
import { useListSubscribers, useDeleteSubscriber, useSendNewsletter, useGetSettings } from "@workspace/api-client-react";
import { buildPostEmailHtml } from "@/lib/emailTemplate";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, Send, Users, AlertCircle, FileText, Code2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListSubscribersQueryKey } from "@workspace/api-client-react";
import { formatDateTime } from "@/lib/format";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminNewsletter() {
  const queryClient = useQueryClient();
  const { data: subscribers, isLoading } = useListSubscribers();
  const { data: settings } = useGetSettings();
  const deleteSubscriber = useDeleteSubscriber();
  const sendNewsletter = useSendNewsletter();

  const [composeMode, setComposeMode] = useState<"template" | "html">("template");

  // Template mode fields
  const [tmplTitle, setTmplTitle] = useState("");
  const [tmplUrl, setTmplUrl] = useState("");
  const [tmplExcerpt, setTmplExcerpt] = useState("");
  const [tmplImage, setTmplImage] = useState("");
  const [tmplCategory, setTmplCategory] = useState("");

  // Shared fields
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [fromName, setFromName] = useState("");

  const buildTemplateHtml = () =>
    buildPostEmailHtml({
      siteName: settings?.siteName || "Vectric",
      siteUrl: window.location.origin,
      postTitle: tmplTitle,
      postUrl: tmplUrl || window.location.origin,
      excerpt: tmplExcerpt || null,
      featuredImageUrl: tmplImage || null,
      categoryName: tmplCategory || null,
    });

  const handleDelete = (id: number) => {
    if (confirm("Remove this subscriber?")) {
      deleteSubscriber.mutate(
        { id },
        {
          onSuccess: () => {
            toast.success("Subscriber removed");
            queryClient.invalidateQueries({ queryKey: getListSubscribersQueryKey() });
          }
        }
      );
    }
  };

  const handleSend = () => {
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    if (composeMode === "template" && !tmplTitle.trim()) { toast.error("Article title is required"); return; }
    if (composeMode === "html" && !htmlBody.trim()) { toast.error("Email body is required"); return; }
    if (!confirm(`Send this newsletter to all ${subscribers?.length || 0} subscribers?`)) return;

    const html = composeMode === "template" ? buildTemplateHtml() : htmlBody;

    sendNewsletter.mutate(
      { data: { subject, html, fromName: fromName || undefined } },
      {
        onSuccess: (result: any) => {
          if (result.error) {
            toast.error(result.error);
          } else if (result.warning) {
            toast.warning(result.warning);
            setSubject(""); setHtmlBody(""); setTmplTitle(""); setTmplUrl(""); setTmplExcerpt(""); setTmplImage(""); setTmplCategory("");
          } else {
            toast.success(result.message || `Sent to ${result.sent} subscribers`);
            setSubject(""); setHtmlBody(""); setTmplTitle(""); setTmplUrl(""); setTmplExcerpt(""); setTmplImage(""); setTmplCategory("");
          }
        },
        onError: (err: any) => {
          const msg = (err?.data as any)?.error || err?.message || "Failed to send newsletter";
          toast.error(msg, { duration: 8000 });
        }
      }
    );
  };

  const hasResendKey = !!settings?.resendApiKey;
  const hasFromEmail = !!(settings?.newsletterFromEmail || settings?.contactEmail);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Newsletter</h1>
          <p className="text-gray-500 mt-1">Manage subscribers and send newsletters</p>
        </div>
        <Button variant="outline" onClick={() => {
          const csv = subscribers?.map(s => s.email).join('\n') || '';
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.setAttribute('href', url);
          a.setAttribute('download', 'subscribers.csv');
          a.click();
        }}>
          Export CSV
        </Button>
      </div>

      <Tabs defaultValue="compose">
        <TabsList className="mb-6">
          <TabsTrigger value="compose"><Send className="w-4 h-4 mr-2" />Compose & Send</TabsTrigger>
          <TabsTrigger value="subscribers"><Users className="w-4 h-4 mr-2" />Subscribers ({subscribers?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          {(!hasResendKey || !hasFromEmail) && (
            <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="space-y-1">
                <strong>Setup required before you can send newsletters.</strong>
                <ul className="list-disc list-inside text-sm mt-1 space-y-0.5">
                  {!hasResendKey && <li><strong>Resend API Key</strong> is missing — add it in <a href="/admin/settings" className="underline font-medium">Admin → Settings → Email</a></li>}
                  {!hasFromEmail && <li><strong>Newsletter From Email</strong> is missing — set it in <a href="/admin/settings" className="underline font-medium">Admin → Settings → Email</a></li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5 max-w-2xl">

            {/* Mode switcher */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit">
              <button
                onClick={() => setComposeMode("template")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${composeMode === "template" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
              >
                <FileText className="w-3.5 h-3.5" /> Article Template
              </button>
              <button
                onClick={() => setComposeMode("html")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${composeMode === "html" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Code2 className="w-3.5 h-3.5" /> Custom HTML
              </button>
            </div>

            {/* Shared: From name */}
            <div>
              <Label>From Name <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder={settings?.siteName || "Your site name"} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Shown as the sender name in recipients' inboxes</p>
            </div>

            {/* Shared: Subject */}
            <div>
              <Label>Subject <span className="text-red-500">*</span></Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. New article: How AI is changing work" className="mt-1" />
            </div>

            {/* Template mode */}
            {composeMode === "template" && (
              <div className="space-y-4 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/40 p-4">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Article Details</p>
                <div>
                  <Label>Article Title <span className="text-red-500">*</span></Label>
                  <Input value={tmplTitle} onChange={e => setTmplTitle(e.target.value)} placeholder="How AI Is Reshaping the Future of Work" className="mt-1" />
                </div>
                <div>
                  <Label>Article URL <span className="text-red-500">*</span></Label>
                  <Input value={tmplUrl} onChange={e => setTmplUrl(e.target.value)} placeholder="https://vectric.online/blog/my-article-slug" className="mt-1" />
                </div>
                <div>
                  <Label>Excerpt / Preview Text <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <Textarea value={tmplExcerpt} onChange={e => setTmplExcerpt(e.target.value)} placeholder="A short teaser that draws readers in…" rows={2} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category <span className="text-gray-400 font-normal">(optional)</span></Label>
                    <Input value={tmplCategory} onChange={e => setTmplCategory(e.target.value)} placeholder="Technology" className="mt-1" />
                  </div>
                  <div>
                    <Label>Featured Image URL <span className="text-gray-400 font-normal">(optional)</span></Label>
                    <Input value={tmplImage} onChange={e => setTmplImage(e.target.value)} placeholder="https://…" className="mt-1" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Use the <strong>Send Newsletter</strong> button in the Post Editor to fill this automatically.
                </p>
              </div>
            )}

            {/* HTML mode */}
            {composeMode === "html" && (
              <div>
                <Label>Email Body (HTML) <span className="text-red-500">*</span></Label>
                <Textarea value={htmlBody} onChange={e => setHtmlBody(e.target.value)} placeholder={"<h1>Hello!</h1>\n<p>Here's what's new this week...</p>"} rows={12} className="mt-1 font-mono text-sm" />
                <p className="text-xs text-muted-foreground mt-1">Full HTML is supported. Sent exactly as typed.</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Sending to <strong>{subscribers?.length || 0}</strong> subscriber{(subscribers?.length || 0) !== 1 ? "s" : ""}
              </p>
              <Button onClick={handleSend} disabled={sendNewsletter.isPending || !hasResendKey || !hasFromEmail || (subscribers?.length || 0) === 0}>
                <Send className="w-4 h-4 mr-2" />
                {sendNewsletter.isPending ? "Sending…" : "Send Newsletter"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subscribers">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscribed On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : subscribers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">No subscribers yet</TableCell>
                  </TableRow>
                ) : (
                  subscribers?.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(sub.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(sub.id)} className="text-red-500 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
