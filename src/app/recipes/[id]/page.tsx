import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  ChefHat,
  Scale,
  ClipboardList,
  Pencil,
  Trash2,
  ExternalLink,
  Thermometer,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getRecipe } from "@/lib/actions/recipes";
import { IngredientRow } from "@/components/recipes/ingredient-row";
import { RecipeDetailActions } from "@/components/recipes/recipe-detail-actions";

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

const STEP_TYPE_LABELS: Record<string, string> = {
  levain_build: "Levain Build",
  autolyse: "Autolyse",
  mix: "Mix",
  bulk_ferment: "Bulk Ferment",
  fold: "Fold",
  shape: "Shape",
  cold_proof: "Cold Proof",
  warm_proof: "Warm Proof",
  preheat: "Preheat",
  score: "Score",
  bake: "Bake",
  cool: "Cool",
  other: "Other",
};

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);

  if (isNaN(recipeId)) {
    notFound();
  }

  const result = await getRecipe(recipeId);

  if (!result.success || !result.data) {
    notFound();
  }

  const recipe = result.data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={recipe.name}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/recipes/${recipe.id}/scale`}>
                <Scale className="mr-1.5 h-4 w-4" />
                Scale
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/recipes/${recipe.id}/weigh-sheet`}>
                <ClipboardList className="mr-1.5 h-4 w-4" />
                Weigh Sheet
              </Link>
            </Button>
            <RecipeDetailActions recipeId={recipe.id} recipeName={recipe.name} />
          </div>
        }
      />

      {/* Recipe info card */}
      <Card className="mb-8 overflow-hidden p-0">
        {recipe.imageUrl && (
          <div className="relative h-64 w-full">
            <Image
              src={recipe.imageUrl}
              alt={recipe.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        )}

        <div className="p-6">
          {recipe.description && (
            <p className="mb-4 text-text-secondary">{recipe.description}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {recipe.category && (
              <Badge variant="secondary">{recipe.category}</Badge>
            )}
            {recipe.isSourdough && <Badge>Sourdough</Badge>}
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-text-secondary">
            {recipe.yieldQuantity && (
              <div className="flex items-center gap-1.5">
                <ChefHat className="h-4 w-4" />
                <span>
                  Yield: {recipe.yieldQuantity}
                  {recipe.yieldUnit ? ` ${recipe.yieldUnit}` : ""}
                </span>
              </div>
            )}
            {recipe.prepTimeMinutes && (
              <div className="flex items-center gap-1.5">
                <Timer className="h-4 w-4" />
                <span>Prep: {formatTime(recipe.prepTimeMinutes)}</span>
              </div>
            )}
            {recipe.cookTimeMinutes && (
              <div className="flex items-center gap-1.5">
                <Thermometer className="h-4 w-4" />
                <span>Cook: {formatTime(recipe.cookTimeMinutes)}</span>
              </div>
            )}
            {recipe.totalTimeMinutes && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Total: {formatTime(recipe.totalTimeMinutes)}</span>
              </div>
            )}
          </div>

          {recipe.sourceUrl && (
            <div className="mt-4">
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View original source
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Ingredients */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-text-primary">
              Ingredients
            </h2>
          </div>

          <Card className="p-5">
            <RecipeIngredientsSection ingredients={recipe.ingredients} />
          </Card>
        </section>
      )}

      {/* Instructions */}
      {recipe.instructions && recipe.instructions.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 font-serif text-2xl font-semibold text-text-primary">
            Instructions
          </h2>

          <div className="space-y-4">
            {recipe.instructions.map((step, index) => (
              <Card key={step.id} className="p-5">
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 font-mono text-sm font-semibold text-accent">
                    {index + 1}
                  </span>

                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {step.stepType && (
                        <Badge variant="secondary">
                          {STEP_TYPE_LABELS[step.stepType] || step.stepType}
                        </Badge>
                      )}
                      {step.durationMinutes && (
                        <span className="flex items-center gap-1 text-xs text-text-secondary">
                          <Timer className="h-3 w-3" />
                          {formatTime(step.durationMinutes)}
                        </span>
                      )}
                      {step.temperatureF && (
                        <span className="flex items-center gap-1 text-xs text-text-secondary">
                          <Thermometer className="h-3 w-3" />
                          {step.temperatureF}&deg;F
                        </span>
                      )}
                    </div>

                    {step.name && (
                      <p className="mb-1 font-medium text-text-primary">
                        {step.name}
                      </p>
                    )}

                    <p className="text-text-secondary leading-relaxed">
                      {step.text}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Notes */}
      {recipe.notes && (
        <section className="mb-8">
          <h2 className="mb-4 font-serif text-2xl font-semibold text-text-primary">
            Notes
          </h2>
          <Card className="p-5">
            <p className="whitespace-pre-wrap text-text-secondary leading-relaxed">
              {recipe.notes}
            </p>
          </Card>
        </section>
      )}
    </div>
  );
}

function RecipeIngredientsSection({
  ingredients,
}: {
  ingredients: Array<{
    id: number;
    rawText: string;
    quantity: string | null;
    unit: string | null;
    ingredientName: string | null;
    unitGrams: string | null;
    isFlour: boolean | null;
    bakersPercentage: string | null;
    prepNotes: string | null;
    sectionLabel: string | null;
  }>;
}) {
  const ingredientsWithSectionHeader = ingredients.map((ing, index) => {
    const previousSection = index > 0 ? ingredients[index - 1]?.sectionLabel : null;
    const showSectionHeader = Boolean(
      ing.sectionLabel && ing.sectionLabel !== previousSection
    );
    return { ing, showSectionHeader };
  });

  return (
    <div className="space-y-1">
      {ingredientsWithSectionHeader.map(({ ing, showSectionHeader }) => {
        return (
          <div key={ing.id}>
            {showSectionHeader && (
              <p className="mb-1 mt-4 text-xs font-medium uppercase tracking-wider text-text-tertiary first:mt-0">
                {ing.sectionLabel}
              </p>
            )}
            <IngredientRow
              ingredient={ing}
              showGrams={true}
              showPercentage={false}
            />
          </div>
        );
      })}
    </div>
  );
}
