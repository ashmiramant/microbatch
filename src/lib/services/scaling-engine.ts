/**
 * Scaling engine for recipe ingredients.
 *
 * Supports three scaling modes:
 * - multiplier: direct multiplier (e.g., 2x)
 * - quantity: scale based on target yield vs. recipe yield
 * - pan: scale based on pan volume ratios
 *
 * Also provides baker's percentage calculation and smart rounding.
 */

import { formatWeight } from '@/lib/utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScalingMode = 'multiplier' | 'quantity' | 'pan';

export interface ScalingInput {
  mode: ScalingMode;
  multiplier?: number;
  targetQuantity?: number;
  recipeYieldQuantity?: number;
  targetPanVolumeMl?: number;
  originalPanVolumeMl?: number;
}

export interface ScaledIngredient {
  ingredientName: string;
  originalGrams: number;
  scaledGrams: number;
  displayWeight: string;
  isFlour: boolean;
  bakersPercentage: number | null;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Calculate the scaling factor based on the selected mode.
 *
 * - multiplier mode: returns the multiplier directly
 * - quantity mode: targetQuantity / recipeYieldQuantity
 * - pan mode: targetPanVolumeMl / originalPanVolumeMl
 *
 * Returns 1 if required fields are missing or invalid.
 */
export function calculateScalingFactor(input: ScalingInput): number {
  switch (input.mode) {
    case 'multiplier': {
      return input.multiplier ?? 1;
    }
    case 'quantity': {
      const target = input.targetQuantity;
      const recipeYield = input.recipeYieldQuantity;
      if (!target || !recipeYield || recipeYield === 0) return 1;
      return target / recipeYield;
    }
    case 'pan': {
      const targetVol = input.targetPanVolumeMl;
      const originalVol = input.originalPanVolumeMl;
      if (!targetVol || !originalVol || originalVol === 0) return 1;
      return targetVol / originalVol;
    }
    default:
      return 1;
  }
}

/**
 * Smart-round a gram value based on its magnitude.
 *
 * - > 1000g: nearest 1g
 * - 100-1000g: nearest 1g
 * - 10-100g: nearest 0.5g
 * - < 10g: nearest 0.1g
 */
export function smartRound(grams: number): number {
  if (grams >= 10) {
    if (grams >= 100) {
      return Math.round(grams);
    }
    // 10-100g: round to nearest 0.5
    return Math.round(grams * 2) / 2;
  }
  // < 10g: round to nearest 0.1
  return Math.round(grams * 10) / 10;
}

/**
 * Scale a list of ingredients by the given factor.
 *
 * Computes baker's percentages based on total flour weight.
 * Baker's percentage = (ingredient weight / total flour weight) * 100,
 * expressed as a ratio (e.g., 0.65 for 65%).
 */
export function scaleIngredients(
  ingredients: Array<{
    ingredientName: string;
    unitGrams: number | null;
    isFlour: boolean;
  }>,
  factor: number,
): ScaledIngredient[] {
  // Calculate total flour weight (after scaling)
  const totalFlourGrams = ingredients.reduce((sum, ing) => {
    if (ing.isFlour && ing.unitGrams !== null) {
      return sum + ing.unitGrams * factor;
    }
    return sum;
  }, 0);

  return ingredients.map((ing) => {
    const originalGrams = ing.unitGrams ?? 0;
    const rawScaled = originalGrams * factor;
    const scaledGrams = smartRound(rawScaled);

    let bakersPercentage: number | null = null;
    if (totalFlourGrams > 0 && ing.unitGrams !== null) {
      bakersPercentage = rawScaled / totalFlourGrams;
    }

    return {
      ingredientName: ing.ingredientName,
      originalGrams,
      scaledGrams,
      displayWeight: formatWeight(scaledGrams),
      isFlour: ing.isFlour,
      bakersPercentage,
    };
  });
}

/**
 * Calculate the interior volume of a pan in milliliters (or cubic centimeters).
 *
 * All dimensions should be provided in centimeters.
 *
 * Supported shapes:
 * - "rectangular" or "rectangle": length * width * height
 * - "square": length * length * height (length is the side)
 * - "round" or "circle": pi * (diameter/2)^2 * height
 */
export function calculatePanVolume(
  shape: string,
  dimensions: {
    length?: number;
    width?: number;
    diameter?: number;
    height: number;
  },
): number {
  const normalizedShape = shape.toLowerCase().trim();

  switch (normalizedShape) {
    case 'rectangular':
    case 'rectangle': {
      const { length, width, height } = dimensions;
      if (length === undefined || width === undefined) return 0;
      return length * width * height;
    }
    case 'square': {
      const { length, height } = dimensions;
      if (length === undefined) return 0;
      return length * length * height;
    }
    case 'round':
    case 'circle': {
      const { diameter, height } = dimensions;
      if (diameter === undefined) return 0;
      const radius = diameter / 2;
      return Math.PI * radius * radius * height;
    }
    default:
      return 0;
  }
}
