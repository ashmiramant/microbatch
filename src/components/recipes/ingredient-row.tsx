import { cn } from "@/lib/utils";

interface IngredientRowProps {
  ingredient: {
    rawText: string;
    quantity: string | null;
    unit: string | null;
    ingredientName: string | null;
    unitGrams: string | null;
    isFlour: boolean | null;
    bakersPercentage: string | null;
    prepNotes: string | null;
  };
  showGrams?: boolean;
  showPercentage?: boolean;
}

export function IngredientRow({
  ingredient,
  showGrams = true,
  showPercentage = false,
}: IngredientRowProps) {
  const hasQuantity = ingredient.quantity !== null;
  const quantityDisplay = hasQuantity
    ? `${ingredient.quantity}${ingredient.unit ? ` ${ingredient.unit}` : ""}`
    : null;

  const gramsValue = ingredient.unitGrams
    ? parseFloat(ingredient.unitGrams)
    : null;

  const percentageValue = ingredient.bakersPercentage
    ? parseFloat(ingredient.bakersPercentage)
    : null;

  return (
    <div
      className={cn(
        "flex items-baseline gap-3 py-2",
        ingredient.isFlour && "border-l-2 border-accent/40 pl-3"
      )}
    >
      <div className="w-20 flex-shrink-0 text-right text-sm text-text-secondary">
        {quantityDisplay}
      </div>

      <div className="flex-1">
        <span className="font-medium text-text-primary">
          {ingredient.ingredientName || ingredient.rawText}
        </span>
        {ingredient.prepNotes && (
          <span className="ml-1.5 text-sm italic text-text-tertiary">
            {ingredient.prepNotes}
          </span>
        )}
      </div>

      {showGrams && gramsValue !== null && (
        <div className="flex-shrink-0 font-mono text-sm text-text-secondary">
          {gramsValue.toFixed(gramsValue >= 10 ? 0 : 1)} g
        </div>
      )}

      {showPercentage && percentageValue !== null && (
        <div className="w-16 flex-shrink-0 text-right font-mono text-sm text-text-secondary">
          {(percentageValue * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
