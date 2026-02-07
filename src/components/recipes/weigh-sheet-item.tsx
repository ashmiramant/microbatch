"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface WeighSheetItemProps {
  name: string;
  grams: number;
  checked: boolean;
  onToggle: () => void;
}

export function WeighSheetItem({
  name,
  grams,
  checked,
  onToggle,
}: WeighSheetItemProps) {
  return (
    <div
      className={cn(
        "flex min-h-[56px] cursor-pointer items-center gap-4 border-b border-border/50 px-2 py-3 transition-opacity",
        checked && "opacity-50"
      )}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={() => onToggle()}
        className="h-6 w-6"
        onClick={(e) => e.stopPropagation()}
      />

      <span
        className={cn(
          "flex-1 font-serif text-xl text-text-primary",
          checked && "line-through"
        )}
      >
        {name}
      </span>

      <span
        className={cn(
          "font-mono text-2xl font-bold text-text-primary",
          checked && "line-through"
        )}
      >
        {grams >= 10 ? Math.round(grams) : grams.toFixed(1)} g
      </span>
    </div>
  );
}
