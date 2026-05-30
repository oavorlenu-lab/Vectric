import { useState } from "react";
import { useListAdSlots, useCreateAdSlot, useUpdateAdSlot, useDeleteAdSlot } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getListAdSlotsQueryKey } from "@workspace/api-client-react";
import { Plus, Trash2, Edit, Eye, EyeOff, Megaphone } from "lucide-react";

const PLACEMENT_TYPES = [
  { value: "inline", label: "Inline", description: "Inside content flow" },
  { value: "sidebar", label: "Sidebar", description: "Side column" },
  { value: "header", label: "Header Area", description: "Below navigation" },
  { value: "footer", label: "Footer Area", description: "Above footer" },
  { value: "floating", label: "Floating / Sticky", description: "Fixed overlay" },
] as const;

const PAGE_TYPES = [
  { value: "all", label: "All Pages" },
  { value: "homepage", label: "Homepage" },
  { value: "blog", label: "Blog Articles" },
  { value: "category", label: "Category Pages" },
  { value: "search", label: "Search Pages" },
] as const;

const placementColor: Record<string, string> = {
  inline: "bg-blue-100 text-blue-700",
  sidebar: "bg-purple-100 text-purple-700",
  header: "bg-orange-100 text-orange-700",
  footer: "bg-gray-100 text-gray-700",
  floating: "bg-green-100 text-green-700",
};

const pageColor: Record<string, string> = {
  all: "bg-slate-100 text-slate-700",
  homepage: "bg-yellow-100 text-yellow-700",
  blog: "bg-indigo-100 text-indigo-700",
  category: "bg-pink-100 text-pink-700",
  search: "bg-cyan-100 text-cyan-700",
};

const emptyForm = {
  name: "",
  placementType: "inline" as string,
  pageType: "all" as string,
  script: "",
  description: "",
  sortOrder: 0,
  isEnabled: true,
};

export default function AdminAds() {
  const queryClient = useQueryClient();
  const { data: slots, isLoading } = useListAdSlots();

  const createSlot = useCreateAdSlot();
  const updateSlot = useUpdateAdSlot();
  const deleteSlot = useDeleteAdSlot();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListAdSlotsQueryKey() });

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (slot: any) => {
    setEditingId(slot.id);
    setForm({
      name: slot.name,
      placementType: slot.placementType,
      pageType: slot.pageType,
      script: slot.script || "",
      description: slot.description || "",
      sortOrder: slot.sortOrder ?? 0,
      isEnabled: slot.isEnabled,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }

    const payload = {
      name: form.name,
      placementType: form.placementType,
      pageType: form.pageType,
      script: form.script || undefined,
      description: form.description || undefined,
      sortOrder: Number(form.sortOrder),
      isEnabled: form.isEnabled,
    };

    if (editingId) {
      updateSlot.mutate({ id: editingId, data: payload }, {
        onSuccess: () => { toast.success("Ad block updated"); invalidate(); setIsDialogOpen(false); }
      });
    } else {
      createSlot.mutate({ data: payload as any }, {
        onSuccess: () => { toast.success("Ad block created"); invalidate(); setIsDialogOpen(false); }
      });
    }
  };

  const handleToggle = (id: number, isEnabled: boolean) => {
    updateSlot.mutate({ id, data: { isEnabled } }, { onSuccess: invalidate });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Delete "${name}"? This will remove the ad from all pages immediately.`)) {
      deleteSlot.mutate({ id }, { onSuccess: () => { toast.success("Ad block deleted"); invalidate(); } });
    }
  };

  const placementLabel = (val: string) => PLACEMENT_TYPES.find(p => p.value === val)?.label ?? val;
  const pageLabel = (val: string) => PAGE_TYPES.find(p => p.value === val)?.label ?? val;

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">Advertisement Blocks</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Create and place ads on any page, any position — fully dynamic, no fixed slots.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Ad Block
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {PLACEMENT_TYPES.map(pt => {
          const count = slots?.filter(s => s.placementType === pt.value).length ?? 0;
          const enabled = slots?.filter(s => s.placementType === pt.value && s.isEnabled).length ?? 0;
          return (
            <div key={pt.value} className="bg-white rounded-xl border p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-gray-900">{enabled}</div>
              <div className="text-xs text-gray-500 mt-0.5">{pt.label}</div>
              {count !== enabled && <div className="text-xs text-gray-400">{count - enabled} disabled</div>}
            </div>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !slots?.length ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No ad blocks yet</h3>
          <p className="text-gray-500 mt-1 mb-6 text-sm">
            Create your first ad block and choose exactly where it should appear.
          </p>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Ad Block
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Group by placement type */}
          {PLACEMENT_TYPES.map(pt => {
            const group = slots.filter(s => s.placementType === pt.value);
            if (!group.length) return null;
            return (
              <div key={pt.value}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">
                  {pt.label} — {pt.description}
                </h2>
                <div className="space-y-2">
                  {group.sort((a, b) => a.sortOrder - b.sortOrder).map(slot => (
                    <div key={slot.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                      <div className="flex items-start md:items-center gap-3 p-4">
                        {/* Enable toggle */}
                        <Switch
                          checked={slot.isEnabled}
                          onCheckedChange={val => handleToggle(slot.id, val)}
                          className="shrink-0 mt-0.5 md:mt-0"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 text-sm">{slot.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${placementColor[slot.placementType] ?? "bg-gray-100 text-gray-600"}`}>
                              {placementLabel(slot.placementType)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pageColor[slot.pageType] ?? "bg-gray-100 text-gray-600"}`}>
                              {pageLabel(slot.pageType)}
                            </span>
                            {slot.sortOrder !== 0 && (
                              <span className="text-xs text-gray-400">order: {slot.sortOrder}</span>
                            )}
                            {!slot.isEnabled && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <EyeOff className="w-3 h-3" /> Disabled
                              </span>
                            )}
                          </div>
                          {slot.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{slot.description}</p>
                          )}
                          {slot.script ? (
                            <p className="text-xs text-gray-400 font-mono mt-1 line-clamp-1 max-w-xl truncate">{slot.script.slice(0, 120)}</p>
                          ) : (
                            <p className="text-xs text-amber-600 mt-1 italic">No code — will show placeholder</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(slot)} title="Edit">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50" onClick={() => handleDelete(slot.id, slot.name)} title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editingId ? "Edit Ad Block" : "New Ad Block"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="settings" className="mt-2">
            <TabsList className="mb-4">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="code">Ad Code</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-1.5">
                <Label>Ad Block Name <span className="text-red-500">*</span></Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Google AdSense — Homepage Banner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Page / Context</Label>
                  <Select value={form.pageType} onValueChange={v => setForm(f => ({ ...f, pageType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAGE_TYPES.map(pt => (
                        <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Which page(s) this ad appears on</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Placement Type</Label>
                  <Select value={form.placementType} onValueChange={v => setForm(f => ({ ...f, placementType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLACEMENT_TYPES.map(pt => (
                        <SelectItem key={pt.value} value={pt.value}>
                          {pt.label} — {pt.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Where in the layout this ad appears</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500">Lower = shown first in same zone</p>
                </div>
                <div className="space-y-1.5 flex flex-col justify-end pb-1">
                  <Label>Enabled</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Switch
                      checked={form.isEnabled}
                      onCheckedChange={v => setForm(f => ({ ...f, isEnabled: v }))}
                    />
                    <span className="text-sm text-gray-600">{form.isEnabled ? "Live on site" : "Hidden from site"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description (optional)</Label>
                <Input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Internal note — e.g. 'AdSense 728×90 leaderboard'"
                />
              </div>

              {/* Placement explanation */}
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 border border-blue-200">
                <p className="font-semibold mb-1">
                  📍 Placement: <span className="capitalize">{placementLabel(form.placementType)}</span> on <span>{pageLabel(form.pageType)}</span>
                </p>
                <p className="text-xs text-blue-700">
                  {form.placementType === "inline" && "Will appear inside content flow — between paragraphs or below sections."}
                  {form.placementType === "sidebar" && "Will appear in the right sidebar column beside the content."}
                  {form.placementType === "header" && "Will appear in the header zone, below the navigation bar."}
                  {form.placementType === "footer" && "Will appear in the footer zone, above the site footer."}
                  {form.placementType === "floating" && "Will appear as a fixed overlay in the bottom-right corner of the screen."}
                  {" "}
                  {form.pageType === "all" ? "Appears on every page." : `Only appears on ${pageLabel(form.pageType).toLowerCase()}.`}
                </p>
              </div>
            </TabsContent>

            {/* CODE TAB */}
            <TabsContent value="code" className="space-y-4">
              <div className="space-y-1.5">
                <Label>HTML / JavaScript Ad Code</Label>
                <Textarea
                  value={form.script}
                  onChange={e => setForm(f => ({ ...f, script: e.target.value }))}
                  placeholder={'<!-- Paste your ad network code here -->\n<!-- Examples: Google AdSense, Media.net, Ezoic, etc. -->\n\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>\n<ins class="adsbygoogle"\n  style="display:block"\n  data-ad-client="ca-pub-XXXXXXXXXX"\n  data-ad-slot="XXXXXXXXXX"\n  data-ad-format="auto"\n  data-full-width-responsive="true"></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>'}
                  className="font-mono text-xs min-h-[200px] md:min-h-[300px]"
                />
                <p className="text-xs text-gray-500">
                  Leave empty to show an "Advertisement" placeholder that reserves space. Paste any ad network code (AdSense, Media.net, custom banners, etc.)
                </p>
              </div>
            </TabsContent>

            {/* PREVIEW TAB */}
            <TabsContent value="preview">
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  This is how the ad zone will appear on the site. Script-based ads (like AdSense) will execute live — static HTML/image banners render immediately.
                </p>
                <div className="border rounded-xl overflow-hidden bg-gray-50 p-4 min-h-[120px] flex items-center justify-center">
                  {form.script ? (
                    <div
                      className="w-full"
                      dangerouslySetInnerHTML={{ __html: form.script }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <div className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 text-center">
                        <p className="text-xs font-medium tracking-widest uppercase">Advertisement</p>
                        <p className="text-xs mt-1">Placeholder — no code provided</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  <strong>Note:</strong> AdSense and similar networks require your site to be live and verified. They may not render in this admin preview.
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createSlot.isPending || updateSlot.isPending}>
              {editingId ? "Save Changes" : "Create Ad Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
