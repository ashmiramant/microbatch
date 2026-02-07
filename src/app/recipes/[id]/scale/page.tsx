"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { getRecipe } from "@/lib/actions/recipes";
import {
  calculateScalingFactor,
  scaleIngredients,
  type ScalingMode,
  type ScaledIngredient,
} from "@/lib/services/scaling-engine";

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
    quantity: string | null;
    unit: string | null;
  }>;
};

export default function ScalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const recipeId = parseInt(id, 10);

  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scaling state
  const [mode, setMode] = useState<ScalingMode>("multiplier");
  const [multiplier, setMultiplier] = useState("1");
  const [targetQuantity, setTargetQuantity] = useState("");
  const [showPercentage, setShowPercentage] = useState(false);

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

  const scalingFactor = useMemo(() => {
    switch (mode) {
      case "multiplier":
        return calculateScalingFactor({
          mode: "multiplier",
          multiplier: parseFloat(multiplier) || 1,
        });
      case "quantity":
        return calculateScalingFactor({
          mode: "quantity",
          targetQuantity: parseFloat(targetQuantity) || 0,
          recipeYieldQuantity: recipe?.yieldQuantity
            ? parseFloat(recipe.yieldQuantity)
            : 1,
        });
      case "pan":
        return 1; // Pan mode placeholder
      default:
        return 1;
    }
  }, [mode, multiplier, targetQuantity, recipe]);

  const scaledIngredients: ScaledIngredient[] = useMemo(() => {
    if (!recipe?.ingredients) return [];
    return scaleIngredients(
      recipe.ingredients.map((ing) => ({
        ingredientName: ing.ingredientName || ing.rawText,
        unitGrams: ing.unitGrams ? parseFloat(ing.unitGrams) : null,
        isFlour: ing.isFlour ?? false,
      })),
      scalingFactor
    );
  }, [recipe, scalingFactor]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-24">
          <p className="text-text-secondary">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={`Scale: ${recipe.name}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/recipes/${recipe.id}`}>
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link
                href={`/recipes/${recipe.id}/weigh-sheet?scale=${scalingFactor}`}
              >
                <ClipboardList className="mr-1.5 h-4 w-4" />
                View Weigh Sheet
              </Link>
            </Button>
          </div>
        }
      />

      {/* Scaling controls */}
      <Card className="mb-8 p-6">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as ScalingMode)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="multiplier" className="flex-1">
              Multiplier
            </TabsTrigger>
            <TabsTrigger value="quantity" className="flex-1">
              Quantity Target
            </TabsTrigger>
            <TabsTrigger value="pan" className="flex-1">
              Pan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="multiplier">
            <div className="space-y-4">
              <Label>Scale Factor</Label>
              <div className="flex items-center gap-3">
                {["0.5", "1", "1.5", "2", "3"].map((val) => (
                  <Button
                    key={val}
                    variant={multiplier === val ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMultiplier(val)}
                  >
                    {val}x
                  </Button>
                ))}
                <Input
                  type="number"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                  className="w-24"
                  step="0.1"
                  min="0.1"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quantity">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipe yields</Label>
                  <p className="text-lg font-medium text-text-primary">
                    {recipe.yieldQuantity || "1"}
                    {recipe.yieldUnit ? ` ${recipe.yieldUnit}` : ""}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-quantity">Target quantity</Label>
                  <Input
                    id="target-quantity"
                    type="number"
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(e.target.value)}
                    placeholder="e.g., 4"
                    min="0.1"
                    step="0.5"
                  />
                </div>
              </div>
              {targetQuantity && (
                <p className="text-sm text-text-secondary">
                  Scaling factor:{" "}
                  <span className="font-mono font-medium text-accent">
                    {scalingFactor.toFixed(2)}x
                  </span>
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pan">
            <div className="py-6 text-center text-sm text-text-secondary">
              Pan-based scaling coming soon. Use the multiplier or quantity
              target modes for now.
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Scaling factor display */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Scaling by{" "}
          <span className="font-mono font-semibold text-accent">
            {scalingFactor.toFixed(2)}x
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-percentage"
            checked={showPercentage}
            onCheckedChange={(checked) => setShowPercentage(checked === true)}
          />
          <Label htmlFor="show-percentage" className="cursor-pointer text-sm">
            Show baker&apos;s %
          </Label>
        </div>
      </div>

      {/* Scaled ingredients */}
      <Card className="p-0">
        <div className="border-b border-border px-5 py-3">
          <div className="flex items-center text-xs font-medium uppercase tracking-wider text-text-tertiary">
            <span className="flex-1">Ingredient</span>
            <span className="w-24 text-right">Original</span>
            <span className="w-24 text-right">Scaled</span>
            {showPercentage && <span className="w-20 text-right">BP %</span>}
          </div>
        </div>

        <div className="divide-y divide-border/50">
          {scaledIngredients.map((ing, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center px-5 py-3",
                ing.isFlour && "bg-accent/5"
              )}
            >
              <span
                className={cn(
                  "flex-1 font-medium text-text-primary",
                  ing.isFlour && "text-accent"
                )}
              >
                {ing.ingredientName}
                {ing.isFlour && (
                  <Badge variant="default" className="ml-2 text-[10px]">
                    Flour
                  </Badge>
                )}
              </span>
              <span className="w-24 text-right font-mono text-sm text-text-secondary">
                {ing.originalGrams > 0
                  ? `${ing.originalGrams >= 10 ? Math.round(ing.originalGrams) : ing.originalGrams.toFixed(1)} g`
                  : "--"}
              </span>
              <span className="w-24 text-right font-mono text-lg font-semibold text-text-primary">
                {ing.scaledGrams > 0 ? ing.displayWeight : "--"}
              </span>
              {showPercentage && (
                <span className="w-20 text-right font-mono text-sm text-text-secondary">
                  {ing.bakersPercentage !== null
                    ? `${(ing.bakersPercentage * 100).toFixed(1)}%`
                    : "--"}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Total weight */}
        <div className="border-t border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="font-serif text-lg font-semibold text-text-primary">
              Total Weight
            </span>
            <span className="font-mono text-xl font-bold text-text-primary">
              {(() => {
                const total = scaledIngredients.reduce(
                  (sum, ing) => sum + ing.scaledGrams,
                  0
                );
                if (total >= 1000) {
                  return `${(total / 1000).toFixed(2)} kg`;
                }
                return `${Math.round(total)} g`;
              })()}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
