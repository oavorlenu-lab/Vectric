import { useListSubscribers, useDeleteSubscriber, getListSubscribersQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Download } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { data: subscribers, isLoading } = useListSubscribers();
  const deleteSubscriber = useDeleteSubscriber();

  const handleDelete = (id: number) => {
    if (!confirm("Remove this subscriber?")) return;
    deleteSubscriber.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Subscriber removed");
          queryClient.invalidateQueries({ queryKey: getListSubscribersQueryKey() });
        },
        onError: () => toast.error("Failed to remove subscriber"),
      }
    );
  };

  const handleExport = () => {
    const csv = ["Email,Subscribed On", ...(subscribers?.map(s => `${s.email},${s.createdAt}`) || [])].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Subscribers</h1>
          <p className="text-gray-500 mt-1">
            {isLoading ? "Loading…" : `${subscribers?.length ?? 0} newsletter subscriber${(subscribers?.length ?? 0) !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!subscribers?.length}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

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
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">Loading…</TableCell>
              </TableRow>
            ) : !subscribers?.length ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">No subscribers yet</TableCell>
              </TableRow>
            ) : (
              subscribers.map((sub) => (
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(sub.id)}
                      className="text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
