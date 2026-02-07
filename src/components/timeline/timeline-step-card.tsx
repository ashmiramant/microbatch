"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils/date";

const stepTypeColors: Record<string, string> = {
  levain_build: "bg-accent",
  autolyse: "bg-accent",
  mix: "bg-accent",
  bulk_ferment: "bg-success",
  fold: "bg-success",
  shape: "bg-blue-500",
  cold_proof: "bg-blue-500",
  warm_proof: "bg-blue-500",
  preheat: "bg-warning",
  score: "bg-warning",
  bake: "bg-warning",
  cool: "bg-gray-400",
};

interface TimelineStepCardProps {
  step: {
    id: number;
    stepType: string;
    name: string;
    description: string | null;
    scheduledStartAt: Date | null;
    scheduledEndAt: Date | null;
    status: string;
  };
  onUpdateStatus: (stepId: number, status: string) => void;
  isUpdating?: boolean;
}

export function TimelineStepCard({
  step,
  onUpdateStatus,
  isUpdating,
}: TimelineStepCardProps) {
  const dotColor = stepTypeColors[step.stepType] ?? "bg-gray-400";
  const isCompleted = step.status === "completed";
  const isActive = step.status === "active";
  const isSkipped = step.status === "skipped";

  // Calculate duration in minutes
  let durationMinutes: number | null = null;
  if (step.scheduledStartAt && step.scheduledEndAt) {
    const start = new Date(step.scheduledStartAt).getTime();
    const end = new Date(step.scheduledEndAt).getTime();
    durationMinutes = Math.round((end - start) / 60000);
  }

  const formatDuration = (mins: number): string => {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  };

  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
            isCompleted && "bg-success",
            isActive && `${dotColor} animate-pulse`,
            isSkipped && "bg-gray-300",
            !isCompleted && !isActive && !isSkipped && dotColor
          )}
        >
          {isCompleted && (
            <svg
              className="h-2.5 w-2.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <div className="w-px flex-1 bg-border" />
      </div>

      {/* Content */}
      <div
        className={cn(
          "-mt-1 flex-1 rounded-lg border border-border bg-surface p-4 transition",
          isActive && "border-accent/50 shadow-sm",
          isSkipped && "opacity-60",
          isCompleted && "border-success/30"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4
                className={cn(
                  "font-serif text-sm font-semibold text-text-primary",
                  isSkipped && "line-through"
                )}
              >
                {step.name}
              </h4>
              {durationMinutes !== null && durationMinutes > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {formatDuration(durationMinutes)}
                </Badge>
              )}
            </div>

            {step.description && (
              <p className="mt-1 text-sm text-text-secondary">
                {step.description}
              </p>
            )}

            {/* Time display */}
            <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
              {step.scheduledStartAt && (
                <span>{formatTime(step.scheduledStartAt)}</span>
              )}
              {step.scheduledStartAt && step.scheduledEndAt && (
                <span className="text-border">-</span>
              )}
              {step.scheduledEndAt && (
                <span>{formatTime(step.scheduledEndAt)}</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-1">
            {step.status === "upcoming" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateStatus(step.id, "active")}
                  disabled={isUpdating}
                >
                  Start
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onUpdateStatus(step.id, "skipped")}
                  disabled={isUpdating}
                  className="text-text-secondary"
                >
                  Skip
                </Button>
              </>
            )}
            {step.status === "active" && (
              <Button
                size="sm"
                onClick={() => onUpdateStatus(step.id, "completed")}
                disabled={isUpdating}
              >
                Complete
              </Button>
            )}
            {isCompleted && (
              <span className="text-xs font-medium text-success">Done</span>
            )}
            {isSkipped && (
              <span className="text-xs text-text-secondary">Skipped</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
