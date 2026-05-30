import { useEffect, useRef } from "react";
import { useListAdSlots } from "@workspace/api-client-react";

interface AdZoneProps {
  pageType: string;
  placementType: string;
  className?: string;
}

type SlotItem = {
  id: number;
  name: string;
  placementType: string;
  pageType: string;
  script?: string | null;
  isEnabled: boolean;
  sortOrder: number;
};

function SingleAdBlock({ slot }: { slot: SlotItem }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !slot.script) return;

    // Clear and re-inject HTML so scripts re-execute on content change
    el.innerHTML = slot.script;

    // Re-create <script> nodes so the browser executes them
    el.querySelectorAll("script").forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value)
      );
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [slot.script]);

  if (!slot.script) {
    return (
      <div className="ad-placeholder flex items-center justify-center w-full py-5 px-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-xs font-medium tracking-widest text-gray-400 uppercase select-none">
        Advertisement
      </div>
    );
  }

  return <div ref={containerRef} className="ad-rendered w-full overflow-hidden" />;
}

export function AdZone({ pageType, placementType, className = "" }: AdZoneProps) {
  const { data: allSlots } = useListAdSlots();

  if (!allSlots) return null;

  const matching = allSlots
    .filter(
      (s) =>
        s.isEnabled &&
        s.placementType === placementType &&
        (s.pageType === pageType || s.pageType === "all")
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (matching.length === 0) return null;

  return (
    <div className={`ad-zone w-full flex flex-col gap-3 my-4 ${className}`}>
      {matching.map((slot) => (
        <SingleAdBlock key={slot.id} slot={slot} />
      ))}
    </div>
  );
}

/** Renders fixed-position floating ads (position: fixed). 
 *  Place once globally in PublicLayout. */
export function FloatingAdZone() {
  const { data: allSlots } = useListAdSlots();

  if (!allSlots) return null;

  const floating = allSlots
    .filter((s) => s.isEnabled && s.placementType === "floating")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (floating.length === 0) return null;

  return (
    <>
      {floating.map((slot) => (
        <div
          key={slot.id}
          className="fixed bottom-6 right-6 z-50 max-w-xs shadow-2xl rounded-xl overflow-hidden"
          role="complementary"
          aria-label="Advertisement"
        >
          {slot.script ? (
            <div dangerouslySetInnerHTML={{ __html: slot.script }} />
          ) : (
            <div className="bg-gray-100 border border-dashed border-gray-300 px-6 py-4 text-xs text-gray-400 uppercase tracking-widest text-center">
              Advertisement
            </div>
          )}
        </div>
      ))}
    </>
  );
}
