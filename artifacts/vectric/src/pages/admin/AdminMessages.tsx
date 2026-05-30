import { useListMessages, useUpdateMessage, useDeleteMessage } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, Mail, MailOpen } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListMessagesQueryKey } from "@workspace/api-client-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function AdminMessages() {
  const queryClient = useQueryClient();
  const { data: messages, isLoading } = useListMessages();
  
  const updateMessage = useUpdateMessage();
  const deleteMessage = useDeleteMessage();

  const handleToggleRead = (id: number, isRead: boolean) => {
    updateMessage.mutate(
      { id, data: { isRead: !isRead } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey() });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this message?")) {
      deleteMessage.mutate(
        { id },
        {
          onSuccess: () => {
            toast.success("Message deleted");
            queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey() });
          }
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-1">Contact form submissions</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>From</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : messages?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">No messages</TableCell>
              </TableRow>
            ) : (
              messages?.map((msg) => (
                <TableRow key={msg.id} className={cn(!msg.isRead && "bg-blue-50/30 font-medium")}>
                  <TableCell>
                    <button onClick={() => handleToggleRead(msg.id, msg.isRead)} className="text-gray-400 hover:text-primary">
                      {msg.isRead ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4 text-primary fill-primary/20" />}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div>{msg.name}</div>
                    <div className="text-xs text-muted-foreground font-normal">{msg.email}</div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate">{msg.message}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(msg.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(msg.id)} className="text-red-500 hover:bg-red-50">
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
