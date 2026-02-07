"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  className,
}: NumberStepperProps) {
  const canDecrement = value - step >= min;
  const canIncrement = value + step <= max;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => canDecrement && onChange(value - step)}
        disabled={!canDecrement}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary transition hover:bg-background hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Decrease"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[3rem] text-center font-mono text-sm text-text-primary">
        {value}
      </span>
      <button
        type="button"
        onClick={() => canIncrement && onChange(value + step)}
        disabled={!canIncrement}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary transition hover:bg-background hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Increase"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
