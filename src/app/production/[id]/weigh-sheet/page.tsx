"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { getProductionRun } from "@/lib/actions/production";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { formatWeight } from "@/lib/utils/format";

type Ingredient = {
  id: number;
  rawText: string;
  ingredientName: string | null;
  quantity: string | null;
  unit: string | null;
  unitGrams: string | null;
};

type Batch = {
  id: number;
  recipe: {
    name: string;
    ingredients: Ingredient[];
  } | null;
  scalingFactor: string | null;
  targetQuantity: number | null;
};

export default function WeighSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [runName, setRunName] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      const result = await getProductionRun(Number(id));
      if (result.success && result.data) {
        setRunName(result.data.name);
        setBatches(
          result.data.batches.map((b) => ({
            id: b.id,
            recipe: b.recipe
              ? {
                  name: b.recipe.name,
                  ingredients: (b.recipe as { ingredients?: Ingredient[] })
                    .ingredients ?? [],
                }
              : null,
            scalingFactor: b.scalingFactor,
            targetQuantity: b.targetQuantity,
          }))
        );
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const toggleChecked = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Weigh Sheet" description="Loading..." />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Weigh Sheet: ${runName}`}
        description={`${batches.length} batch${batches.length !== 1 ? "es" : ""}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              Print
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/production/${id}`}>Back to Run</Link>
            </Button>
          </div>
        }
      />

      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
          <p className="text-sm text-text-secondary">
            No batches in this production run.
          </p>
        </div>
      ) : (
        <div className="space-y-8 print:space-y-4">
          {batches.map((batch) => (
            <Card key={batch.id} className="print:border-0 print:shadow-none">
              <CardHeader>
                <CardTitle>
                  {batch.recipe?.name ?? `Batch #${batch.id}`}
                  {batch.targetQuantity && (
                    <span className="ml-2 text-sm font-normal text-text-secondary">
                      ({batch.targetQuantity} units)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {batch.recipe?.ingredients &&
                batch.recipe.ingredients.length > 0 ? (
                  <div className="space-y-3">
                    {batch.recipe.ingredients.map((ing) => {
                      const key = `${batch.id}-${ing.id}`;
                      const isChecked = checkedItems.has(key);
                      const scale = batch.scalingFactor
                        ? parseFloat(batch.scalingFactor)
                        : batch.targetQuantity ?? 1;

                      // Calculate scaled weight
                      const baseGrams = ing.unitGrams
                        ? parseFloat(ing.unitGrams)
                        : null;
                      const scaledGrams = baseGrams
                        ? baseGrams * scale
                        : null;

                      return (
                        <div
                          key={ing.id}
                          className="flex items-center gap-4 rounded-lg px-3 py-2 transition hover:bg-background"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleChecked(key)}
                            className="print:hidden"
                          />
                          <div className="flex flex-1 items-center justify-between gap-4">
                            <span
                              className={`text-sm text-text-primary ${isChecked ? "line-through opacity-60" : ""}`}
                            >
                              {ing.ingredientName ?? ing.rawText}
                            </span>
                            <span
                              className={`shrink-0 font-mono text-lg font-semibold text-text-primary ${isChecked ? "line-through opacity-60" : ""}`}
                            >
                              {scaledGrams
                                ? formatWeight(scaledGrams)
                                : ing.quantity
                                  ? `${ing.quantity} ${ing.unit ?? ""}`
                                  : ing.rawText}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-text-secondary">
                    No ingredients found for this recipe. View the recipe to add
                    ingredients.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
