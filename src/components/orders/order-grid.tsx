"use client";

import { cn } from "@/lib/utils";
import { NumberStepper } from "@/components/ui/number-stepper";
import { Card, CardContent } from "@/components/ui/card";

interface OrderGridProps {
  recipes: Array<{
    id: number;
    name: string;
    category: string | null;
    imageUrl: string | null;
  }>;
  quantities: Record<number, number>;
  onQuantityChange: (recipeId: number, quantity: number) => void;
}

export function OrderGrid({
  recipes,
  quantities,
  onQuantityChange,
}: OrderGridProps) {
  // Group recipes by category
  const grouped = recipes.reduce<
    Record<string, typeof recipes>
  >((acc, recipe) => {
    const cat = recipe.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(recipe);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
        <p className="font-serif text-lg text-text-primary">No recipes yet</p>
        <p className="mt-1 text-sm text-text-secondary">
          Create some recipes first, then come back to place an order.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary">
            {category}
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {grouped[category].map((recipe) => {
              const qty = quantities[recipe.id] || 0;
              return (
                <Card
                  key={recipe.id}
                  className={cn(
                    "transition-shadow",
                    qty > 0 && "border-accent/40 shadow-md"
                  )}
                >
                  <CardContent className="flex flex-col items-center gap-3 p-4 pt-4">
                    {recipe.imageUrl ? (
                      <div className="h-16 w-16 overflow-hidden rounded-lg bg-background">
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-background text-2xl text-text-secondary">
                        {recipe.name.charAt(0)}
                      </div>
                    )}
                    <h4 className="text-center font-serif text-sm font-semibold text-text-primary leading-tight">
                      {recipe.name}
                    </h4>
                    <NumberStepper
                      value={qty}
                      onChange={(val) => onQuantityChange(recipe.id, val)}
                      min={0}
                      max={999}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
