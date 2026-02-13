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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRecipe } from "@/lib/actions/recipes";
import { getPans } from "@/lib/actions/pans";
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
  defaultPanId?: number | null;
};

type PanData = {
  id: number;
  name: string;
  volumeMl: string | null;
};

export default function ScalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const recipeId = parseInt(id, 10);

  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [pans, setPans] = useState<PanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scaling state
  const [mode, setMode] = useState<ScalingMode>("multiplier");
  const [multiplier, setMultiplier] = useState("1");
  const [targetQuantity, setTargetQuantity] = useState("");
  const [originalPanId, setOriginalPanId] = useState("");
  const [targetPanId, setTargetPanId] = useState("");
  const [showPercentage, setShowPercentage] = useState(false);

  useEffect(() => {
    async function fetchRecipeAndPans() {
      setLoading(true);
      try {
        const [recipeResult, pansResult] = await Promise.all([
          getRecipe(recipeId),
          getPans(),
        ]);

        if (recipeResult.success && recipeResult.data) {
          const recipeData = recipeResult.data as unknown as RecipeData;
          setRecipe(recipeData);

          if (pansResult.success && pansResult.data) {
            const panList = pansResult.data as unknown as PanData[];
            setPans(panList);

            const recipeDefaultPanId = recipeData.defaultPanId
              ? String(recipeData.defaultPanId)
              : "";

            if (
              recipeDefaultPanId &&
              panList.some((pan) => String(pan.id) === recipeDefaultPanId)
            ) {
              setOriginalPanId(recipeDefaultPanId);
              const firstDifferentPan = panList.find(
                (pan) => String(pan.id) !== recipeDefaultPanId
              );
              if (firstDifferentPan) {
                setTargetPanId(String(firstDifferentPan.id));
              }
            }
          }
        } else {
          setError("Recipe not found.");
        }
      } catch {
        setError("Failed to load recipe or pans.");
      } finally {
        setLoading(false);
      }
    }
    fetchRecipeAndPans();
  }, [recipeId]);

  const pansWithVolume = useMemo(
    () =>
      pans.filter((pan) => {
        const volume = pan.volumeMl ? parseFloat(pan.volumeMl) : 0;
        return volume > 0;
      }),
    [pans]
  );

  const originalPanVolume = useMemo(() => {
    const selectedPan = pansWithVolume.find((pan) => String(pan.id) === originalPanId);
    return selectedPan?.volumeMl ? parseFloat(selectedPan.volumeMl) : 0;
  }, [pansWithVolume, originalPanId]);

  const targetPanVolume = useMemo(() => {
    const selectedPan = pansWithVolume.find((pan) => String(pan.id) === targetPanId);
    return selectedPan?.volumeMl ? parseFloat(selectedPan.volumeMl) : 0;
  }, [pansWithVolume, targetPanId]);

  const recipeDefaultPanId = recipe?.defaultPanId ? String(recipe.defaultPanId) : "";
  const recipeDefaultPan = useMemo(
    () => pansWithVolume.find((pan) => String(pan.id) === recipeDefaultPanId),
    [pansWithVolume, recipeDefaultPanId]
  );

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
        return calculateScalingFactor({
          mode: "pan",
          originalPanVolumeMl: originalPanVolume,
          targetPanVolumeMl: targetPanVolume,
        });
      default:
        return 1;
    }
  }, [
    mode,
    multiplier,
    targetQuantity,
    recipe,
    originalPanVolume,
    targetPanVolume,
  ]);

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
            <div className="space-y-4 pt-2">
              {pansWithVolume.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-4 text-sm text-text-secondary">
                  Add pans with a volume to use pan-based scaling.
                </div>
              ) : (
                <>
                  {recipeDefaultPan ? (
                    <div className="flex items-center justify-between rounded-md border border-border/70 bg-background p-3 text-sm">
                      <p className="text-text-secondary">
                        Recipe default pan:{" "}
                        <span className="font-medium text-text-primary">
                          {recipeDefaultPan.name}
                        </span>
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setOriginalPanId(String(recipeDefaultPan.id))}
                      >
                        Use Recipe Default Pan
                      </Button>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Original Pan</Label>
                      <Select value={originalPanId} onValueChange={setOriginalPanId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select original pan" />
                        </SelectTrigger>
                        <SelectContent>
                          {pansWithVolume.map((pan) => (
                            <SelectItem key={pan.id} value={String(pan.id)}>
                              {pan.name} ({Math.round(parseFloat(pan.volumeMl ?? "0"))} ml)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Target Pan</Label>
                      <Select value={targetPanId} onValueChange={setTargetPanId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target pan" />
                        </SelectTrigger>
                        <SelectContent>
                          {pansWithVolume.map((pan) => (
                            <SelectItem key={pan.id} value={String(pan.id)}>
                              {pan.name} ({Math.round(parseFloat(pan.volumeMl ?? "0"))} ml)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {originalPanId && targetPanId ? (
                    <p className="text-sm text-text-secondary">
                      Pan scale factor:{" "}
                      <span className="font-mono font-medium text-accent">
                        {scalingFactor.toFixed(2)}x
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-text-secondary">
                      Select both pans to calculate scaling.
                    </p>
                  )}
                </>
              )}
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
