"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRecipe } from "@/lib/actions/recipes";
import { scaleIngredients } from "@/lib/services/scaling-engine";
import { WeighSheetItem } from "@/components/recipes/weigh-sheet-item";

type RecipeData = {
  id: number;
  name: string;
  yieldQuantity: string | null;
  yieldUnit: string | null;
  ingredients: Array<{
    id: number;
    ingredientName: string | null;
    unitGrams: string | null;
    isFlour: boolean | null;
    rawText: string;
  }>;
};

export default function WeighSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const recipeId = parseInt(id, 10);
  const searchParams = useSearchParams();
  const scaleParam = searchParams.get("scale");
  const scaleFactor = scaleParam ? parseFloat(scaleParam) : 1;

  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function fetchRecipe() {
      setLoading(true);
      try {
        const result = await getRecipe(recipeId);
        if (result.success && result.data) {
          setRecipe(result.data as unknown as RecipeData);
        } else {
          setError("Recipe not found.");
        }
      } catch {
        setError("Failed to load recipe.");
      } finally {
        setLoading(false);
      }
    }
    fetchRecipe();
  }, [recipeId]);

  const scaledIngredients = useMemo(() => {
    if (!recipe?.ingredients) return [];
    return scaleIngredients(
      recipe.ingredients.map((ing) => ({
        ingredientName: ing.ingredientName || ing.rawText,
        unitGrams: ing.unitGrams ? parseFloat(ing.unitGrams) : null,
        isFlour: ing.isFlour ?? false,
      })),
      scaleFactor
    );
  }, [recipe, scaleFactor]);

  const totalWeight = useMemo(() => {
    return scaledIngredients.reduce((sum, ing) => sum + ing.scaledGrams, 0);
  }, [scaledIngredients]);

  const toggleItem = (index: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-24">
          <p className="text-text-secondary">Loading weigh sheet...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="py-24 text-center">
          <p className="text-text-secondary">{error || "Recipe not found."}</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/recipes">Back to Recipes</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #weigh-sheet,
          #weigh-sheet * {
            visibility: visible;
          }
          #weigh-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 1rem;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="print-hidden">
          <PageHeader
            title={recipe.name}
            description="Weigh Sheet"
            action={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/recipes/${recipe.id}`}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Back
                  </Link>
                </Button>
                <Button size="sm" onClick={handlePrint}>
                  <Printer className="mr-1.5 h-4 w-4" />
                  Print
                </Button>
              </div>
            }
          />
        </div>

        <div id="weigh-sheet">
          {/* Scale factor indicator */}
          {scaleFactor !== 1 && (
            <div className="mb-6 rounded-lg bg-accent/5 px-4 py-3 text-center">
              <span className="text-sm text-text-secondary">Scaled by </span>
              <span className="font-mono text-lg font-bold text-accent">
                {scaleFactor.toFixed(2)}x
              </span>
              {recipe.yieldQuantity && (
                <span className="text-sm text-text-secondary">
                  {" "}
                  ({(parseFloat(recipe.yieldQuantity) * scaleFactor).toFixed(1)}
                  {recipe.yieldUnit ? ` ${recipe.yieldUnit}` : ""})
                </span>
              )}
            </div>
          )}

          {/* Print header (hidden on screen) */}
          <div className="hidden print:block print:mb-4">
            <h1 className="font-serif text-2xl font-bold">{recipe.name}</h1>
            {scaleFactor !== 1 && (
              <p className="text-sm">Scale: {scaleFactor.toFixed(2)}x</p>
            )}
          </div>

          {/* Ingredient list */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-0">
              {scaledIngredients.map((ing, index) => (
                <WeighSheetItem
                  key={index}
                  name={ing.ingredientName}
                  grams={ing.scaledGrams}
                  checked={checkedItems.has(index)}
                  onToggle={() => toggleItem(index)}
                />
              ))}
            </div>

            {/* Total */}
            <div className="mt-6 flex items-center justify-between border-t-2 border-border pt-4">
              <span className="font-serif text-2xl font-semibold text-text-primary">
                Total
              </span>
              <span className="font-mono text-3xl font-bold text-text-primary">
                {totalWeight >= 1000
                  ? `${(totalWeight / 1000).toFixed(2)} kg`
                  : `${Math.round(totalWeight)} g`}
              </span>
            </div>
          </Card>

          {/* Scale link */}
          <div className="mt-6 text-center print-hidden">
            <Button variant="ghost" asChild>
              <Link href={`/recipes/${recipe.id}/scale`}>
                Adjust scaling
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
