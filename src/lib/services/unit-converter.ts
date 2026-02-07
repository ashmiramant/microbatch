/**
 * Unit conversion utilities for baking ingredients.
 * Handles volume-to-mL, weight-to-grams, and mL-to-grams (via density).
 */

import { getDensity } from '@/lib/utils/density-table';

/**
 * Weight per count for items commonly measured by count rather than volume.
 * Values in grams per single item.
 */
const COUNT_WEIGHT_GRAMS: Map<string, number> = new Map([
  ['egg', 50],
  ['eggs', 50],
  ['large egg', 50],
  ['large eggs', 50],
  ['medium egg', 44],
  ['medium eggs', 44],
  ['small egg', 38],
  ['small eggs', 38],
  ['egg yolk', 18],
  ['egg yolks', 18],
  ['egg white', 33],
  ['egg whites', 33],
  ['banana', 120],
  ['bananas', 120],
  ['medium banana', 120],
  ['medium bananas', 120],
  ['large banana', 136],
  ['apple', 182],
  ['apples', 182],
  ['medium apple', 182],
  ['medium apples', 182],
  ['lemon', 58],
  ['lemons', 58],
  ['lime', 44],
  ['limes', 44],
  ['orange', 131],
  ['oranges', 131],
]);

/**
 * Volume unit conversions to milliliters.
 */
const VOLUME_TO_ML: Map<string, number> = new Map([
  ['teaspoon', 4.929],
  ['teaspoons', 4.929],
  ['tsp', 4.929],
  ['tsp.', 4.929],
  ['t', 4.929],

  ['tablespoon', 14.787],
  ['tablespoons', 14.787],
  ['tbsp', 14.787],
  ['tbsp.', 14.787],
  ['tbs', 14.787],

  ['fluid ounce', 29.574],
  ['fluid ounces', 29.574],
  ['fl oz', 29.574],
  ['fl. oz.', 29.574],
  ['fl oz.', 29.574],

  ['cup', 240],
  ['cups', 240],
  ['c', 240],
  ['c.', 240],

  ['pint', 480],
  ['pints', 480],
  ['pt', 480],
  ['pt.', 480],

  ['quart', 960],
  ['quarts', 960],
  ['qt', 960],
  ['qt.', 960],

  ['liter', 1000],
  ['liters', 1000],
  ['litre', 1000],
  ['litres', 1000],
  ['l', 1000],

  ['milliliter', 1],
  ['milliliters', 1],
  ['millilitre', 1],
  ['ml', 1],

  // Sticks (butter-specific, 1 stick = 0.5 cup = 120 mL)
  ['stick', 120],
  ['sticks', 120],
]);

/**
 * Weight unit conversions to grams.
 */
const WEIGHT_TO_GRAMS: Map<string, number> = new Map([
  ['gram', 1],
  ['grams', 1],
  ['g', 1],
  ['g.', 1],

  ['kilogram', 1000],
  ['kilograms', 1000],
  ['kg', 1000],
  ['kg.', 1000],

  ['ounce', 28.3495],
  ['ounces', 28.3495],
  ['oz', 28.3495],
  ['oz.', 28.3495],

  ['pound', 453.592],
  ['pounds', 453.592],
  ['lb', 453.592],
  ['lbs', 453.592],
  ['lb.', 453.592],
  ['lbs.', 453.592],
]);

/**
 * Normalize a unit string for lookup.
 */
function normalizeUnit(unit: string): string {
  return unit.toLowerCase().trim();
}

/**
 * Check if a unit is a volume unit.
 */
function isVolumeUnit(unit: string): boolean {
  return VOLUME_TO_ML.has(normalizeUnit(unit));
}

/**
 * Check if a unit is a weight unit.
 */
function isWeightUnit(unit: string): boolean {
  return WEIGHT_TO_GRAMS.has(normalizeUnit(unit));
}

/**
 * Convert a volume measurement to milliliters.
 *
 * @returns milliliters, or null if the unit is not recognized as a volume unit
 */
export function convertToMl(quantity: number, unit: string): number | null {
  const normalized = normalizeUnit(unit);
  const factor = VOLUME_TO_ML.get(normalized);
  if (factor === undefined) return null;
  return quantity * factor;
}

/**
 * Convert milliliters to grams using the ingredient's density.
 *
 * @returns grams, or null if the ingredient density is not found
 */
export function mlToGrams(ml: number, ingredientName: string): number | null {
  const density = getDensity(ingredientName);
  if (density === null) return null;
  return ml * density;
}

/**
 * Convert a quantity with a unit to grams.
 *
 * For weight units: converts directly to grams.
 * For volume units: converts to mL first, then uses ingredient density to get grams.
 * For "T" (uppercase): treated as tablespoon.
 *
 * @returns grams, or null if conversion is not possible
 */
export function convertToGrams(
  quantity: number,
  unit: string,
  ingredientName: string,
): number | null {
  const normalized = normalizeUnit(unit);

  // Special case: uppercase "T" is tablespoon (but normalizeUnit lowercases it)
  // We handle this by checking original unit before normalization
  const originalTrimmed = unit.trim();
  if (originalTrimmed === 'T') {
    const ml = quantity * 14.787;
    return mlToGrams(ml, ingredientName);
  }

  // Weight unit: direct conversion
  if (isWeightUnit(normalized)) {
    const factor = WEIGHT_TO_GRAMS.get(normalized);
    if (factor === undefined) return null;
    return quantity * factor;
  }

  // Volume unit: convert to mL, then to grams via density
  if (isVolumeUnit(normalized)) {
    const ml = convertToMl(quantity, unit);
    if (ml === null) return null;
    return mlToGrams(ml, ingredientName);
  }

  return null;
}

/**
 * Get the weight in grams for a count-based ingredient (no unit).
 * E.g., "2 large eggs" → 2 × 50g = 100g.
 *
 * @returns grams, or null if the ingredient is not in the count table
 */
export function countToGrams(
  quantity: number,
  ingredientName: string,
): number | null {
  const normalized = ingredientName.toLowerCase().trim().replace(/\s+/g, ' ');

  // Direct lookup
  const direct = COUNT_WEIGHT_GRAMS.get(normalized);
  if (direct !== undefined) return quantity * direct;

  // Substring match: check if any key is contained in the ingredient name
  for (const [key, weight] of COUNT_WEIGHT_GRAMS) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return quantity * weight;
    }
  }

  return null;
}
