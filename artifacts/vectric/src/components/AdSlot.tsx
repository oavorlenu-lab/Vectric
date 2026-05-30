import { useListAdSlots } from "@workspace/api-client-react";

interface AdSlotProps {
  position: string;
  className?: string;
}

export function AdSlot({ position, className = "" }: AdSlotProps) {
  const { data: slots } = useListAdSlots();
  
  if (!slots) return null;
  
  const slot = slots.find(s => s.position === position && s.isEnabled);
  
  if (!slot || !slot.script) return null;
  
  return (
    <div 
      className={`ad-container my-8 w-full flex justify-center ${className}`}
      dangerouslySetInnerHTML={{ __html: slot.script }}
    />
  );
}
