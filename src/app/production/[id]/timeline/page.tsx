"use client";

import { use, useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { getProductionRun, updateTimelineStepStatus } from "@/lib/actions/production";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { TimelineView } from "@/components/timeline/timeline-view";

type TimelineStep = {
  id: number;
  stepType: string;
  name: string;
  description: string | null;
  scheduledStartAt: Date | null;
  scheduledEndAt: Date | null;
  status: string;
};

type Batch = {
  id: number;
  recipeId: number;
  recipe: { name: string } | null;
  timelineSteps: TimelineStep[];
};

export default function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [runName, setRunName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function fetchData() {
      const result = await getProductionRun(Number(id));
      if (result.success && result.data) {
        setRunName(result.data.name);
        setBatches(
          result.data.batches.map((b) => ({
            id: b.id,
            recipeId: b.recipeId,
            recipe: b.recipe ? { name: b.recipe.name } : null,
            timelineSteps: (b.timelineSteps ?? []).map((s) => ({
              id: s.id,
              stepType: s.stepType ?? "other",
              name: s.name ?? "Step",
              description: s.description,
              scheduledStartAt: s.scheduledStartAt,
              scheduledEndAt: s.scheduledEndAt,
              status: s.status ?? "upcoming",
            })),
          }))
        );
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const handleUpdateStatus = (stepId: number, status: string) => {
    startTransition(async () => {
      const result = await updateTimelineStepStatus(
        stepId,
        status as "upcoming" | "active" | "completed" | "skipped"
      );
      if (result.success) {
        // Update local state
        setBatches((prev) =>
          prev.map((batch) => ({
            ...batch,
            timelineSteps: batch.timelineSteps.map((step) =>
              step.id === stepId ? { ...step, status } : step
            ),
          }))
        );
      }
    });
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Timeline" description="Loading..." />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  const allSteps = batches.flatMap((batch) =>
    batch.timelineSteps.map((step) => ({
      ...step,
      batchName: batch.recipe?.name ?? `Batch #${batch.id}`,
    }))
  );

  return (
    <div>
      <PageHeader
        title={`Timeline: ${runName}`}
        description={`${allSteps.length} steps across ${batches.length} batch${batches.length !== 1 ? "es" : ""}`}
        action={
          <Button variant="outline" asChild>
            <Link href={`/production/${id}`}>Back to Run</Link>
          </Button>
        }
      />

      {batches.length === 0 || allSteps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
          <h3 className="font-serif text-xl font-semibold text-text-primary">
            No timeline steps
          </h3>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            Timeline steps have not been generated for this production run yet.
            Steps can be generated from recipe instructions.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {batches
            .filter((b) => b.timelineSteps.length > 0)
            .map((batch) => (
              <div key={batch.id}>
                <h2 className="mb-4 font-serif text-xl font-semibold text-text-primary">
                  {batch.recipe?.name ?? `Batch #${batch.id}`}
                </h2>
                <TimelineView
                  steps={batch.timelineSteps}
                  onUpdateStatus={handleUpdateStatus}
                  isUpdating={isPending}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
