import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductionRun } from "@/lib/actions/production";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BatchStatusBadge } from "@/components/production/batch-status-badge";
import { formatDateTime } from "@/lib/utils/date";
import { ProductionRunActions } from "./production-run-actions";

export default async function ProductionRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProductionRun(Number(id));

  if (!result.success || !result.data) {
    notFound();
  }

  const run = result.data;

  const subPages = [
    { label: "Timeline", href: `/production/${run.id}/timeline` },
    { label: "Weigh Sheet", href: `/production/${run.id}/weigh-sheet` },
    { label: "Shopping List", href: `/production/${run.id}/shopping-list` },
    { label: "Packaging", href: `/production/${run.id}/packaging` },
  ];

  return (
    <div>
      <PageHeader
        title={run.name}
        action={
          <div className="flex items-center gap-3">
            <BatchStatusBadge
              status={run.status ?? "draft"}
              className="text-sm px-3 py-1"
            />
            <ProductionRunActions
              runId={run.id}
              currentStatus={run.status ?? "draft"}
            />
          </div>
        }
      />

      {/* Sub-page navigation */}
      <div className="mb-8 flex flex-wrap gap-2">
        {subPages.map((page) => (
          <Button key={page.href} variant="outline" asChild>
            <Link href={page.href}>{page.label}</Link>
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main content: Batches */}
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-semibold text-text-primary">
            Batches
          </h2>

          {run.batches.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-8 text-center">
              <p className="text-sm text-text-secondary">
                No batches in this production run.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {run.batches.map((batch) => (
                <Card key={batch.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle>
                          {batch.recipe?.name ?? `Recipe #${batch.recipeId}`}
                        </CardTitle>
                        <CardDescription>
                          {batch.scalingMode === "quantity" &&
                            batch.targetQuantity &&
                            `${batch.targetQuantity} units`}
                          {batch.scalingMode === "multiplier" &&
                            batch.scalingFactor &&
                            `${batch.scalingFactor}x multiplier`}
                          {batch.scalingMode === "pan" &&
                            batch.targetPan &&
                            `Scaled to ${batch.targetPan.name}`}
                        </CardDescription>
                      </div>
                      <BatchStatusBadge status={batch.status ?? "pending"} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                      {batch.timelineSteps && batch.timelineSteps.length > 0 && (
                        <span>
                          {batch.timelineSteps.length} timeline step
                          {batch.timelineSteps.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      {batch.notes && <span>{batch.notes}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                  Target Completion
                </p>
                <p className="mt-1 text-sm text-text-primary">
                  {run.targetCompletionAt
                    ? formatDateTime(run.targetCompletionAt)
                    : "Not set"}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                  Linked Order
                </p>
                <p className="mt-1 text-sm text-text-primary">
                  {run.order ? (
                    <Link
                      href={`/orders/${run.order.id}`}
                      className="text-accent hover:underline"
                    >
                      {run.order.name}
                    </Link>
                  ) : (
                    "None"
                  )}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                  Batches
                </p>
                <p className="mt-1 text-sm text-text-primary">
                  {run.batches.length} batch
                  {run.batches.length !== 1 ? "es" : ""}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                  Created
                </p>
                <p className="mt-1 text-sm text-text-primary">
                  {run.createdAt ? formatDateTime(run.createdAt) : "--"}
                </p>
              </div>
            </CardContent>
          </Card>

          {run.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-text-secondary">
                  {run.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
