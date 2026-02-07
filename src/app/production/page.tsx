import Link from "next/link";
import { getProductionRuns } from "@/lib/actions/production";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { RunCard } from "@/components/production/run-card";

export default async function ProductionPage() {
  const result = await getProductionRuns();
  const runs = result.success ? result.data ?? [] : [];

  return (
    <div>
      <PageHeader
        title="Production"
        description="Track and manage your production runs."
        action={
          <Button asChild>
            <Link href="/orders/new">New Run</Link>
          </Button>
        }
      />

      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
          <h3 className="font-serif text-xl font-semibold text-text-primary">
            No production runs yet
          </h3>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            Production runs are created automatically when you submit an order.
            Create an order to get started.
          </p>
          <Button asChild className="mt-6">
            <Link href="/orders/new">Create an Order</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {runs.map((run) => (
            <RunCard
              key={run.id}
              run={{
                id: run.id,
                name: run.name,
                status: run.status ?? "draft",
                targetCompletionAt: run.targetCompletionAt,
                batchCount: run.batches?.length ?? 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
