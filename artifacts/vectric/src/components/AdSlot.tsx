import { useEffect, useRef } from "react";
import { useListAdSlots } from "@workspace/api-client-react";

interface AdSlotProps {
  position: string;
  className?: string;
}

function injectAndExecuteScripts(container: HTMLElement) {
  // dangerouslySetInnerHTML does NOT execute <script> tags.
  // We must recreate each script element so the browser actually runs it.
  const scripts = container.querySelectorAll("script");
  scripts.forEach((oldScript) => {
    const newScript = document.createElement("script");
    Array.from(oldScript.attributes).forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value);
    });
    if (oldScript.textContent) {
      newScript.textContent = oldScript.textContent;
    }
    oldScript.replaceWith(newScript);
  });
}

export function AdSlot({ position, className = "" }: AdSlotProps) {
  const { data: slots } = useListAdSlots();
  const containerRef = useRef<HTMLDivElement>(null);

  const slot = slots?.find((s) => s.position === position && s.isEnabled);
  const hasCode = !!slot?.script?.trim();

  useEffect(() => {
    if (!containerRef.current) return;
    if (!hasCode) {
      containerRef.current.innerHTML = "";
      return;
    }
    containerRef.current.innerHTML = slot!.script!;
    injectAndExecuteScripts(containerRef.current);
  }, [slot?.id, slot?.script, hasCode]);

  if (!slot || !hasCode) return null;

  return (
    <div
      ref={containerRef}
      className={`ad-container my-6 w-full flex justify-center overflow-hidden min-h-[50px] ${className}`}
      aria-label="Advertisement"
    />
  );
}
