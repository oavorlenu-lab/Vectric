import { useListSubscribers, useDeleteSubscriber } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListSubscribersQueryKey } from "@workspace/api-client-react";
import { formatDateTime } from "@/lib/format";

export default function AdminNewsletter() {
  const queryClient = useQueryClient();
  const { data: subscribers, isLoading } = useListSubscribers();
  
  const deleteSubscriber = useDeleteSubscriber();

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

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Newsletter</h1>
          <p className="text-gray-500 mt-1">Manage email subscribers ({subscribers?.length || 0})</p>
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
    </AdminLayout>
  );
}
