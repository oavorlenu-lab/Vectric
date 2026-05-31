import { useState } from "react";
import { useListSubscribers, useDeleteSubscriber, useSendNewsletter, useGetSettings } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, Send, Users, AlertCircle } from "lucide-react";
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

  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [fromName, setFromName] = useState("");

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
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!htmlBody.trim()) {
      toast.error("Email body is required");
      return;
    }
    if (!confirm(`Send this newsletter to all ${subscribers?.length || 0} subscribers?`)) return;

    sendNewsletter.mutate(
      { data: { subject, html: htmlBody, fromName: fromName || undefined } },
      {
        onSuccess: (result) => {
          toast.success(result.message || `Sent to ${result.sent} subscribers`);
          setSubject("");
          setHtmlBody("");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error || "Failed to send newsletter";
          toast.error(msg);
        }
      }
    );
  };

  const hasResendKey = !!settings?.resendApiKey;

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
          {!hasResendKey && (
            <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription>
                <strong>Email not configured.</strong> Go to{" "}
                <a href="/admin/settings" className="underline font-medium">Admin → Settings → Email</a>
                {" "}and add your Resend API key. Get one free at{" "}
                <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">resend.com</a>
                {" "}(3,000 emails/month free).
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5 max-w-2xl">
            <div>
              <Label>From Name (optional)</Label>
              <Input
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                placeholder={settings?.siteName || "Your site name"}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Shown as the sender name in recipients' inboxes</p>
            </div>

            <div>
              <Label>Subject <span className="text-red-500">*</span></Label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Our latest articles this week"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Email Body (HTML supported) <span className="text-red-500">*</span></Label>
              <Textarea
                value={htmlBody}
                onChange={e => setHtmlBody(e.target.value)}
                placeholder={"<h1>Hello!</h1>\n<p>Here's what's new this week...</p>"}
                rows={12}
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">You can write plain text or HTML. The email will be sent exactly as typed.</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Will be sent to <strong>{subscribers?.length || 0}</strong> subscriber{(subscribers?.length || 0) !== 1 ? "s" : ""}
              </p>
              <Button
                onClick={handleSend}
                disabled={sendNewsletter.isPending || !hasResendKey || (subscribers?.length || 0) === 0}
              >
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
