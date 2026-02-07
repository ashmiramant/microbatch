/**
 * Formatting utilities for weights, currencies, and percentages.
 */

/**
 * Smart-format a weight given in grams.
 *
 * - >= 1000g: displayed as "X.XX kg"
 * - > 100g: whole grams (e.g., "250 g")
 * - 10-100g: nearest 0.5g (e.g., "25.5 g")
 * - <= 10g: 1 decimal place (e.g., "3.2 g")
 */
export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    // Show up to 2 decimal places, but strip trailing zeros
    const formatted = kg.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted} kg`;
  }

  if (grams > 100) {
    return `${Math.round(grams)} g`;
  }

  if (grams >= 10) {
    // Round to nearest 0.5
    const rounded = Math.round(grams * 2) / 2;
    const formatted = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
    return `${formatted} g`;
  }

  // <= 10g: 1 decimal place
  return `${grams.toFixed(1)} g`;
}

/**
 * Format a number as USD currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format a value as a baker's percentage.
 * Input is expected as a ratio (e.g., 0.65 for 65%).
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
