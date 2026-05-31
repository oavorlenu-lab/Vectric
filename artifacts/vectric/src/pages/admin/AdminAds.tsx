import { useState } from "react";
import { useListAdSlots, useUpdateAdSlot } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getListAdSlotsQueryKey } from "@workspace/api-client-react";

export default function AdminAds() {
  const queryClient = useQueryClient();
  const { data: slots, isLoading } = useListAdSlots();
  
  const updateSlot = useUpdateAdSlot();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [script, setScript] = useState("");

  const handleEdit = (slot: any) => {
    if (editingId === slot.id) {
      setEditingId(null);
    } else {
      setEditingId(slot.id);
      setScript(slot.script || "");
    }
  };

  const handleSave = (id: number) => {
    updateSlot.mutate(
      { id, data: { script } },
      {
        onSuccess: () => {
          toast.success("Ad slot updated");
          queryClient.invalidateQueries({ queryKey: getListAdSlotsQueryKey() });
          setEditingId(null);
        }
      }
    );
  };

  const handleToggle = (id: number, isEnabled: boolean) => {
    updateSlot.mutate(
      { id, data: { isEnabled } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdSlotsQueryKey() });
        }
      }
    );
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Ad Slots</h1>
        <p className="text-gray-500 mt-1">Manage advertisement placements across the site</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid gap-6">
          {slots?.map(slot => (
            <div key={slot.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 flex items-center justify-between bg-gray-50 border-b">
                <div>
                  <h3 className="font-bold text-gray-900">{slot.name}</h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">{slot.position}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`enable-${slot.id}`} className="text-sm cursor-pointer">Enabled</Label>
                    <Switch 
                      id={`enable-${slot.id}`}
                      checked={slot.isEnabled} 
                      onCheckedChange={(val) => handleToggle(slot.id, val)} 
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(slot)}>
                    {editingId === slot.id ? "Cancel" : "Edit Code"}
                  </Button>
                </div>
              </div>
              
              {editingId === slot.id ? (
                <div className="p-4 space-y-4 bg-blue-50/30">
                  <div className="space-y-2">
                    <Label>HTML/Script Code</Label>
                    <Textarea 
                      value={script} 
                      onChange={e => setScript(e.target.value)} 
                      placeholder="<!-- Paste your ad network code here -->"
                      className="font-mono text-sm h-32"
                    />
                  </div>
                  <Button onClick={() => handleSave(slot.id)} disabled={updateSlot.isPending}>
                    Save Changes
                  </Button>
                </div>
              ) : (
                slot.script ? (
                  <div className="p-4 bg-gray-50 font-mono text-xs text-gray-500 overflow-x-auto truncate max-h-20">
                    {slot.script}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-gray-400 italic">No code provided</div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
