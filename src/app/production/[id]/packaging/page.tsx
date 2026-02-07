"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Package, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProductionRun } from "@/lib/actions/production";
import { getRecipePackaging } from "@/lib/actions/packaging";
import { calculatePackagingNeeds, type PackagingNeed } from "@/lib/services/packaging-calculator";

export default function ProductionPackagingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const runId = parseInt(id, 10);

  const [runName, setRunName] = useState("");
  const [needs, setNeeds] = useState<PackagingNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const runResult = await getProductionRun(runId);
        if (!runResult.success || !runResult.data) return;

        setRunName(runResult.data.name);
        const batches = runResult.data.batches || [];

        const batchPackagingData = await Promise.all(
          batches.map(async (batch: { recipeId: number; targetQuantity: number | null; recipe?: { name: string } }) => {
            const pkgResult = await getRecipePackaging(batch.recipeId);
            const packaging = pkgResult.success && pkgResult.data ? pkgResult.data : [];
            return {
              targetQuantity: batch.targetQuantity || 1,
              packaging: packaging.map((p: { packagingTypeId: number; quantityPerYield: number | null; packagingType: { name: string; currentStock: number | null; reorderThreshold: number | null } }) => ({
                packagingTypeId: p.packagingTypeId,
                name: p.packagingType.name,
                quantityPerYield: p.quantityPerYield || 1,
                currentStock: p.packagingType.currentStock || 0,
                reorderThreshold: p.packagingType.reorderThreshold || 0,
              })),
            };
          })
        );

        const calculated = calculatePackagingNeeds(batchPackagingData);
        setNeeds(calculated);
      } catch {
        // handle error silently
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [runId]);

  const toggleItem = (id: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-24">
          <p className="text-text-secondary">Loading packaging needs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Packaging Checklist"
        description={runName}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/production/${runId}`}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      {needs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-text-tertiary" />
            <p className="text-text-secondary">
              No packaging linked to recipes in this run.
            </p>
            <p className="mt-1 text-sm text-text-tertiary">
              Link packaging types to recipes in the recipe detail or pantry
              pages.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {needs.map((need) => (
            <Card
              key={need.packagingTypeId}
              className={cn(
                "transition-all",
                need.isLowStock && "border-warning/50",
                checkedItems.has(need.packagingTypeId) && "opacity-60"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleItem(need.packagingTypeId)}
                    className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      checkedItems.has(need.packagingTypeId)
                        ? "border-success bg-success text-white"
                        : "border-border hover:border-accent"
                    )}
                  >
                    {checkedItems.has(need.packagingTypeId) && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "font-medium text-text-primary",
                          checkedItems.has(need.packagingTypeId) &&
                            "line-through"
                        )}
                      >
                        {need.name}
                      </span>
                      {need.isLowStock && (
                        <Badge variant="warning" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex gap-4 text-sm text-text-secondary">
                      <span>
                        Need:{" "}
                        <span className="font-mono font-medium text-text-primary">
                          {need.quantityNeeded}
                        </span>
                      </span>
                      <span>
                        In stock:{" "}
                        <span className="font-mono">{need.currentStock}</span>
                      </span>
                      {need.shortfall > 0 && (
                        <span className="text-error">
                          Short:{" "}
                          <span className="font-mono font-medium">
                            {need.shortfall}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
