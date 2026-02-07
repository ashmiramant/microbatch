"use client";

import { TimelineStepCard } from "@/components/timeline/timeline-step-card";

interface TimelineViewProps {
  steps: Array<{
    id: number;
    stepType: string;
    name: string;
    description: string | null;
    scheduledStartAt: Date | null;
    scheduledEndAt: Date | null;
    status: string;
  }>;
  onUpdateStatus: (stepId: number, status: string) => void;
  isUpdating?: boolean;
}

export function TimelineView({
  steps,
  onUpdateStatus,
  isUpdating,
}: TimelineViewProps) {
  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
        <p className="font-serif text-lg text-text-primary">
          No timeline steps yet
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Timeline steps will appear here once they are generated for this
          production run.
        </p>
      </div>
    );
  }

  // Sort steps by scheduled start time
  const sortedSteps = [...steps].sort((a, b) => {
    if (!a.scheduledStartAt) return 1;
    if (!b.scheduledStartAt) return -1;
    return (
      new Date(a.scheduledStartAt).getTime() -
      new Date(b.scheduledStartAt).getTime()
    );
  });

  // Compute progress
  const completedCount = sortedSteps.filter(
    (s) => s.status === "completed"
  ).length;
  const activeCount = sortedSteps.filter((s) => s.status === "active").length;

  return (
    <div>
      {/* Progress summary */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-success transition-all"
              style={{
                width: `${(completedCount / sortedSteps.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <p className="shrink-0 text-sm text-text-secondary">
          {completedCount} / {sortedSteps.length} completed
          {activeCount > 0 && ` (${activeCount} active)`}
        </p>
      </div>

      {/* Timeline */}
      <div className="pl-0">
        {sortedSteps.map((step) => (
          <TimelineStepCard
            key={step.id}
            step={step}
            onUpdateStatus={onUpdateStatus}
            isUpdating={isUpdating}
          />
        ))}
      </div>
    </div>
  );
}
