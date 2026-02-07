"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ImportPreview } from "@/components/recipes/import-preview";
import { createRecipe } from "@/lib/actions/recipes";
import { parseIngredients } from "@/lib/services/ingredient-parser";

type ScrapedRecipe = {
  name: string;
  description: string | null;
  imageUrl: string | null;
  ingredients: string[];
  instructions: Array<{ text: string; name?: string }>;
  yieldText: string | null;
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
};

export default function ImportRecipePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedRecipe, setScrapedRecipe] = useState<ScrapedRecipe | null>(
    null
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setScrapedRecipe(null);

    try {
      const response = await fetch("/api/scrape-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error || `Import failed (${response.status})`
        );
      }

      const data = await response.json();
      setScrapedRecipe(data.recipe ?? data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to import recipe."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: Record<string, unknown>) => {
    if (!scrapedRecipe) return;

    try {
      const ingredientStrings = data.ingredients as string[];
      const parsed = parseIngredients(ingredientStrings);
      const instructionData = data.instructions as Array<{
        text: string;
        name?: string;
      }>;

      const prepTime = (data.prepTimeMinutes as number | null) ?? null;
      const cookTime = (data.cookTimeMinutes as number | null) ?? null;
      const totalTime =
        (data.totalTimeMinutes as number | null) ??
        (prepTime !== null || cookTime !== null
          ? (prepTime || 0) + (cookTime || 0)
          : null);

      // Parse yield text into numeric quantity + unit
      const rawYield = (data.yieldQuantity as string | null) ?? null;
      let yieldQuantity: string | null = null;
      let yieldUnit: string | null = null;
      if (rawYield) {
        const yieldMatch = rawYield.match(/^(\d+(?:\.\d+)?)/);
        if (yieldMatch) {
          yieldQuantity = yieldMatch[1];
          yieldUnit = rawYield.slice(yieldMatch[0].length).replace(/^[-\d\s]*/, '').trim() || null;
        }
      }

      const result = await createRecipe({
        name: data.name as string,
        description: (data.description as string | null) ?? null,
        imageUrl: (data.imageUrl as string | null) ?? null,
        category: (data.category as string | null) ?? null,
        isSourdough: (data.isSourdough as boolean) || null,
        yieldQuantity,
        yieldUnit,
        sourceUrl: url.trim(),
        sourceType: "ld_json",
        prepTimeMinutes: prepTime,
        cookTimeMinutes: cookTime,
        totalTimeMinutes: totalTime,
        ingredients: parsed.map((ing, i) => ({
          sortOrder: i,
          rawText: ing.rawText,
          quantity: ing.quantity !== null ? String(ing.quantity) : null,
          unit: ing.unit,
          unitGrams: ing.unitGrams !== null ? String(ing.unitGrams) : null,
          ingredientName: ing.ingredientName,
          prepNotes: ing.prepNotes,
          isFlour: ing.isFlour,
          bakersPercentage: null,
          sectionLabel: null,
        })),
        instructions: instructionData.map((inst, i) => ({
          sortOrder: i,
          stepType: null,
          name: inst.name || null,
          text: inst.text,
          durationMinutes: null,
          temperatureF: null,
          sectionLabel: null,
        })),
      });

      if (result.success && result.data) {
        router.push(`/recipes/${result.data.id}`);
      } else {
        setSaveError(result.error || "Failed to save recipe.");
      }
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save recipe."
      );
    }
  };

  const handleCancel = () => {
    setScrapedRecipe(null);
    setError(null);
    setSaveError(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Import Recipe"
        description="Import a recipe from a blog or website"
      />

      {!scrapedRecipe && (
        <div className="space-y-8">
          {/* URL input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipe-url">Recipe URL</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    id="recipe-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/recipe/..."
                    className="pl-9"
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleImport();
                      }
                    }}
                  />
                </div>
                <Button onClick={handleImport} disabled={loading || !url.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    "Import"
                  )}
                </Button>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
                  <p className="mt-3 text-sm text-text-secondary">
                    Fetching recipe data...
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-error/20 bg-error/5 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-error" />
                  <div className="space-y-2">
                    <p className="text-sm text-error">{error}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setError(null);
                          handleImport();
                        }}
                      >
                        Try Again
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/recipes/new">Enter Manually</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Manual fallback */}
          <div className="text-center">
            <p className="text-sm text-text-secondary">
              Can&apos;t import from a URL?
            </p>
            <Button variant="ghost" asChild className="mt-2">
              <Link href="/recipes/new">Create recipe manually</Link>
            </Button>
          </div>
        </div>
      )}

      {scrapedRecipe && (
        <>
          {saveError && (
            <div className="mb-6 rounded-lg border border-error/20 bg-error/5 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-error" />
                <p className="text-sm text-error">{saveError}</p>
              </div>
            </div>
          )}
          <ImportPreview
            recipe={scrapedRecipe}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </>
      )}
    </div>
  );
}
