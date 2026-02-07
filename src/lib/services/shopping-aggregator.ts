/**
 * Shopping list aggregator.
 *
 * Combines ingredients across multiple batches, grouping by ingredientId
 * (or by name if ingredientId is null). Sums gram weights and formats
 * display quantities.
 */

import { formatWeight } from '@/lib/utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShoppingItem {
  ingredientId: number | null;
  name: string;
  totalGrams: number;
  displayQuantity: string;
  batches: Array<{ batchName: string; grams: number }>;
}

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Aggregate ingredients from multiple batches into a consolidated shopping list.
 *
 * Ingredients are grouped by ingredientId when available, or by normalized
 * ingredient name when ingredientId is null. Each ingredient's gram weight
 * is multiplied by the batch's scaling factor before summing.
 *
 * @param batches - Array of batch objects, each with a name, scaling factor,
 *                  and list of ingredients.
 * @returns A sorted array of shopping items with totals and per-batch breakdowns.
 */
export function aggregateShoppingList(
  batches: Array<{
    name: string;
    scalingFactor: number;
    ingredients: Array<{
      ingredientId: number | null;
      ingredientName: string;
      unitGrams: number | null;
    }>;
  }>,
): ShoppingItem[] {
  // Use a composite key: ingredientId if available, otherwise the lowercased name
  const itemMap = new Map<
    string,
    {
      ingredientId: number | null;
      name: string;
      totalGrams: number;
      batches: Array<{ batchName: string; grams: number }>;
    }
  >();

  for (const batch of batches) {
    for (const ingredient of batch.ingredients) {
      const grams = (ingredient.unitGrams ?? 0) * batch.scalingFactor;
      const key =
        ingredient.ingredientId !== null
          ? `id:${ingredient.ingredientId}`
          : `name:${ingredient.ingredientName.toLowerCase().trim()}`;

      const existing = itemMap.get(key);
      if (existing) {
        existing.totalGrams += grams;
        existing.batches.push({ batchName: batch.name, grams });
      } else {
        itemMap.set(key, {
          ingredientId: ingredient.ingredientId,
          name: ingredient.ingredientName,
          totalGrams: grams,
          batches: [{ batchName: batch.name, grams }],
        });
      }
    }
  }

  // Convert to output array and sort alphabetically by name
  const items: ShoppingItem[] = [];
  for (const entry of itemMap.values()) {
    items.push({
      ingredientId: entry.ingredientId,
      name: entry.name,
      totalGrams: Math.round(entry.totalGrams * 100) / 100,
      displayQuantity: formatWeight(entry.totalGrams),
      batches: entry.batches,
    });
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}
