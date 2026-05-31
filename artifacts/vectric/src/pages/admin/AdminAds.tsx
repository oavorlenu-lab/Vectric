import { useState } from "react";
import { useListAdSlots, useUpdateAdSlot } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getListAdSlotsQueryKey } from "@workspace/api-client-react";
import {
  ChevronDown, ChevronUp, Code2, CheckCircle2, Circle,
  LayoutTemplate, BookOpen, Info, Megaphone
} from "lucide-react";

// Metadata for each ad slot position
const SLOT_META: Record<string, {
  page: string;
  location: string;
  sizes: string;
  tip: string;
  priority: "high" | "medium" | "low";
}> = {
  homepage_below_hero: {
    page: "Homepage",
    location: "Below the hero/featured section",
    sizes: "Leaderboard 728×90 · Responsive",
    tip: "High-traffic placement. Use a responsive ad unit for best coverage on mobile.",
    priority: "high",
  },
  homepage_between_sections: {
    page: "Homepage",
    location: "Between Latest Stories and the sidebar",
    sizes: "Large Rectangle 336×280 · Responsive",
    tip: "In-feed placement — blends with content for higher engagement.",
    priority: "medium",
  },
  homepage_above_footer: {
    page: "Homepage",
    location: "Above the page footer",
    sizes: "Leaderboard 728×90 · Responsive",
    tip: "Good for remnant inventory. Users who scroll this far are engaged.",
    priority: "low",
  },
  article_after_intro: {
    page: "Article",
    location: "After the first ~2 paragraphs of article content",
    sizes: "In-Article · Responsive",
    tip: "⭐ Highest-earning placement. Readers are engaged and haven't bounced yet.",
    priority: "high",
  },
  article_mid_content: {
    page: "Article",
    location: "Midway through article content",
    sizes: "In-Article · Responsive",
    tip: "Catches readers deep in the content — high viewability and CTR.",
    priority: "high",
  },
  article_before_related: {
    page: "Article",
    location: "Between article body and related posts",
    sizes: "Leaderboard 728×90 · Responsive",
    tip: "Natural break point — readers have finished the article and are deciding what to do next.",
    priority: "medium",
  },
  article_end: {
    page: "Article",
    location: "After article body, below tags and CTA buttons",
    sizes: "Large Rectangle 336×280 · Responsive",
    tip: "End-of-content placement. Good complement to in-article ads.",
    priority: "medium",
  },
  article_sidebar: {
    page: "Article",
    location: "Sticky sidebar — desktop only",
    sizes: "Medium Rectangle 300×250 · Skyscraper 160×600",
    tip: "Sticky sidebar ads stay visible as users scroll. Use a 300×250 or 160×600 unit.",
    priority: "high",
  },
  category_top: {
    page: "Category",
    location: "Below the category header, above the post grid",
    sizes: "Leaderboard 728×90 · Responsive",
    tip: "Category pages attract targeted readers — great for niche advertisers.",
    priority: "medium",
  },
};

const PRIORITY_COLORS = {
  high: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

const PAGE_COLORS: Record<string, string> = {
  Homepage: "bg-purple-100 text-purple-700",
  Article: "bg-amber-100 text-amber-700",
  Category: "bg-teal-100 text-teal-700",
};

export default function AdminAds() {
  const queryClient = useQueryClient();
  const { data: slots, isLoading } = useListAdSlots();
  const updateSlot = useUpdateAdSlot();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [scripts, setScripts] = useState<Record<number, string>>({});

  const handleExpand = (slot: any) => {
    if (expandedId === slot.id) {
      setExpandedId(null);
    } else {
      setExpandedId(slot.id);
      setScripts(prev => ({ ...prev, [slot.id]: slot.script || "" }));
    }
  };

  const handleSave = (id: number) => {
    updateSlot.mutate(
      { id, data: { script: scripts[id] } },
      {
        onSuccess: () => {
          toast.success("Ad code saved");
          queryClient.invalidateQueries({ queryKey: getListAdSlotsQueryKey() });
          setExpandedId(null);
        },
        onError: () => toast.error("Failed to save"),
      }
    );
  };

  const handleToggle = (id: number, isEnabled: boolean) => {
    updateSlot.mutate(
      { id, data: { isEnabled } },
      {
        onSuccess: () => {
          toast.success(isEnabled ? "Ad slot enabled" : "Ad slot disabled");
          queryClient.invalidateQueries({ queryKey: getListAdSlotsQueryKey() });
        },
      }
    );
  };

  const handleClear = (id: number) => {
    if (!confirm("Remove the ad code from this slot?")) return;
    updateSlot.mutate(
      { id, data: { script: "", isEnabled: false } },
      {
        onSuccess: () => {
          toast.success("Ad code removed");
          queryClient.invalidateQueries({ queryKey: getListAdSlotsQueryKey() });
          setScripts(prev => ({ ...prev, [id]: "" }));
        },
      }
    );
  };

  const activeCount = slots?.filter(s => s.isEnabled && s.script).length ?? 0;
  const withCodeCount = slots?.filter(s => s.script).length ?? 0;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-primary" />
            Ad Slots
          </h1>
          <p className="text-gray-500 mt-1">
            Paste ad network code (AdSense, etc.) for each slot — it goes live instantly.
          </p>
        </div>
        <div className="flex gap-3 text-sm shrink-0">
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
            <div className="font-bold text-green-700 text-lg">{activeCount}</div>
            <div className="text-green-600 text-xs">Active</div>
          </div>
          <div className="bg-gray-50 border rounded-lg px-3 py-2 text-center">
            <div className="font-bold text-gray-700 text-lg">{withCodeCount}</div>
            <div className="text-gray-500 text-xs">With code</div>
          </div>
          <div className="bg-gray-50 border rounded-lg px-3 py-2 text-center">
            <div className="font-bold text-gray-700 text-lg">{slots?.length ?? 0}</div>
            <div className="text-gray-500 text-xs">Total slots</div>
          </div>
        </div>
      </div>

      {/* AdSense quick guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-5 mb-8">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900 mb-1">How to add Google AdSense</p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Go to <strong>AdSense → Ads → By ad unit</strong> and create a new Display or In-article ad unit.</li>
              <li>Copy the full code snippet (includes both the <code className="bg-blue-100 px-1 rounded text-xs">&lt;script&gt;</code> tag and the <code className="bg-blue-100 px-1 rounded text-xs">&lt;ins&gt;</code> tag).</li>
              <li>Paste it into the slot below and click <strong>Save code</strong>.</li>
              <li>Toggle the slot <strong>Enabled</strong> — the ad appears on your site immediately.</li>
            </ol>
            <p className="text-xs text-blue-600 mt-2">
              💡 AdSense auto-ads are separate — add their global site tag to your <code className="bg-blue-100 px-1 rounded">index.html</code> instead.
            </p>
          </div>
        </div>
      </div>

      {/* Visual placement guide */}
      <div className="mb-8 bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-sm text-gray-700">Ad Placement Map</span>
        </div>
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Homepage wireframe */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Homepage</span>
            </div>
            <div className="border rounded-lg overflow-hidden text-xs">
              <div className="bg-gray-800 text-white text-center py-1.5 font-bold tracking-wide">HEADER / NAV</div>
              <div className="bg-gray-100 py-4 text-center text-gray-400 font-medium">Hero Section</div>
              <div className="bg-amber-100 border-2 border-amber-400 border-dashed text-center py-2 text-amber-700 font-bold">① Below Hero</div>
              <div className="bg-gray-50 py-3 text-center text-gray-400">Latest Stories Grid</div>
              <div className="bg-amber-100 border-2 border-amber-400 border-dashed text-center py-2 text-amber-700 font-bold">② Between Sections</div>
              <div className="bg-gray-50 py-2 text-center text-gray-300">Trending / Sidebar</div>
              <div className="bg-amber-100 border-2 border-amber-400 border-dashed text-center py-2 text-amber-700 font-bold">③ Above Footer</div>
              <div className="bg-gray-200 text-center py-1.5 text-gray-500">FOOTER</div>
            </div>
          </div>

          {/* Article wireframe */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Article Page</span>
            </div>
            <div className="border rounded-lg overflow-hidden text-xs">
              <div className="bg-gray-800 text-white text-center py-1.5 font-bold">HEADER / NAV</div>
              <div className="bg-gray-100 py-2 text-center text-gray-400">Title & Hero Image</div>
              <div className="bg-green-100 border-2 border-green-400 border-dashed text-center py-1.5 text-green-700 font-bold">④ After Intro ⭐</div>
              <div className="bg-gray-50 py-2 text-center text-gray-400">Article content…</div>
              <div className="bg-green-100 border-2 border-green-400 border-dashed text-center py-1.5 text-green-700 font-bold">⑤ Mid Content ⭐</div>
              <div className="bg-gray-50 py-2 text-center text-gray-400">…more content</div>
              <div className="bg-amber-100 border-2 border-amber-400 border-dashed text-center py-1.5 text-amber-700 font-bold">⑥ Article End</div>
              <div className="bg-amber-100 border-2 border-amber-400 border-dashed text-center py-1.5 text-amber-700 font-bold">⑦ Before Related</div>
              <div className="bg-gray-100 py-1.5 text-center text-gray-400">Related Posts</div>
              <div className="bg-gray-200 text-center py-1.5 text-gray-500">FOOTER</div>
            </div>
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded text-xs p-2 text-blue-700">
              <span className="font-bold">⑧ Sidebar</span> — sticky 300×250 on desktop, alongside the article
            </div>
          </div>

          {/* Category wireframe */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded">Category Page</span>
            </div>
            <div className="border rounded-lg overflow-hidden text-xs">
              <div className="bg-gray-800 text-white text-center py-1.5 font-bold">HEADER / NAV</div>
              <div className="bg-gray-100 py-3 text-center text-gray-400">Category Header</div>
              <div className="bg-amber-100 border-2 border-amber-400 border-dashed text-center py-2 text-amber-700 font-bold">⑨ Category Top</div>
              <div className="bg-gray-50 py-6 text-center text-gray-300">Post Grid</div>
              <div className="bg-gray-200 text-center py-1.5 text-gray-500">FOOTER</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ad slot cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {slots?.map((slot) => {
            const meta = SLOT_META[slot.position];
            const isExpanded = expandedId === slot.id;
            const hasCode = !!slot.script?.trim();
            const isActive = slot.isEnabled && hasCode;

            return (
              <div
                key={slot.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${isExpanded ? "ring-2 ring-primary/20" : ""}`}
              >
                {/* Slot header row */}
                <div className="flex items-center gap-3 p-4">
                  {/* Status icon */}
                  <div className="shrink-0">
                    {isActive
                      ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                      : <Circle className="w-5 h-5 text-gray-300" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900">{slot.name}</span>
                      {meta && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAGE_COLORS[meta.page] || "bg-gray-100 text-gray-600"}`}>
                          {meta.page}
                        </span>
                      )}
                      {meta && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[meta.priority]}`}>
                          {meta.priority === "high" ? "⭐ High value" : meta.priority === "medium" ? "Medium" : "Low"}
                        </span>
                      )}
                      {hasCode && !slot.isEnabled && (
                        <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">Has code · Disabled</Badge>
                      )}
                      {isActive && (
                        <Badge className="text-xs bg-green-500 text-white">Live</Badge>
                      )}
                    </div>
                    {meta && (
                      <p className="text-xs text-gray-500 truncate">{meta.location}</p>
                    )}
                  </div>

                  {/* Right controls */}
                  <div className="flex items-center gap-3 shrink-0">
                    {hasCode && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 hidden sm:inline">
                          {slot.isEnabled ? "On" : "Off"}
                        </span>
                        <Switch
                          checked={slot.isEnabled}
                          onCheckedChange={(val) => handleToggle(slot.id, val)}
                        />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => handleExpand(slot)}
                    >
                      <Code2 className="w-4 h-4" />
                      <span className="hidden sm:inline">{hasCode ? "Edit code" : "Add code"}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded editor */}
                {isExpanded && (
                  <div className="border-t bg-gray-50/50 p-4 space-y-4">
                    {/* Tip box */}
                    {meta && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                        <span className="font-semibold">Placement tip: </span>{meta.tip}
                        <div className="text-xs text-amber-600 mt-1">
                          Recommended sizes: <span className="font-mono font-medium">{meta.sizes}</span>
                        </div>
                      </div>
                    )}

                    {/* Code textarea */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                        <Code2 className="w-4 h-4" />
                        Ad code (HTML / JavaScript)
                      </label>
                      <Textarea
                        value={scripts[slot.id] ?? slot.script ?? ""}
                        onChange={e => setScripts(prev => ({ ...prev, [slot.id]: e.target.value }))}
                        placeholder={`<!-- Paste your AdSense or ad network code here -->\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>\n<ins class="adsbygoogle" ...></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`}
                        className="font-mono text-xs min-h-[160px] bg-white border-gray-200"
                        spellCheck={false}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <Button
                        onClick={() => handleSave(slot.id)}
                        disabled={updateSlot.isPending}
                      >
                        Save code
                      </Button>
                      {hasCode && (
                        <Button
                          variant="outline"
                          onClick={() => handleToggle(slot.id, !slot.isEnabled)}
                        >
                          {slot.isEnabled ? "Disable slot" : "Enable slot"}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => setExpandedId(null)}
                      >
                        Cancel
                      </Button>
                      {hasCode && (
                        <Button
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
                          onClick={() => handleClear(slot.id)}
                        >
                          Remove code
                        </Button>
                      )}
                    </div>

                    <p className="text-xs text-gray-400">
                      Saving code does not enable the slot automatically — use the toggle above to go live.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom tip */}
      <div className="mt-8 bg-gray-50 border rounded-xl p-4 md:p-5 flex gap-3">
        <BookOpen className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-700">Best practice: </span>
          Start with the two highest-value slots — <strong>Article After Intro</strong> and <strong>Article Mid Content</strong> — then add the <strong>Article Sidebar</strong> for desktop. Enable homepage slots last as they see lower CTR but high impression volume. Always test with AdSense's ad preview tool before going live.
        </div>
      </div>
    </AdminLayout>
  );
}
