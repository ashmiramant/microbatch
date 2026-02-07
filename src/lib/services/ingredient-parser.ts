/**
 * Ingredient string parser for baking recipes.
 *
 * Parses raw ingredient strings like "2 1/4 cups all-purpose flour, sifted"
 * into structured data with quantity, unit, name, prep notes, and gram weight.
 *
 * Implemented from scratch using regex-based steps -- no external parsing packages.
 */

import { convertToGrams, countToGrams } from '@/lib/services/unit-converter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedIngredient {
  rawText: string;
  quantity: number | null;
  unit: string | null;
  ingredientName: string;
  prepNotes: string | null;
  unitGrams: number | null;
  isFlour: boolean;
}

// ---------------------------------------------------------------------------
// Unicode fraction map
// ---------------------------------------------------------------------------

const UNICODE_FRACTIONS: Record<string, number> = {
  '\u00BD': 0.5,     // 1/2
  '\u00BC': 0.25,    // 1/4
  '\u00BE': 0.75,    // 3/4
  '\u2153': 0.333,   // 1/3
  '\u2154': 0.667,   // 2/3
  '\u2155': 0.2,     // 1/5
  '\u2156': 0.4,     // 2/5
  '\u2157': 0.6,     // 3/5
  '\u2158': 0.8,     // 4/5
  '\u2159': 0.167,   // 1/6
  '\u215A': 0.833,   // 5/6
  '\u2150': 0.143,   // 1/7
  '\u215B': 0.125,   // 1/8
  '\u215C': 0.375,   // 3/8
  '\u215D': 0.625,   // 5/8
  '\u215E': 0.875,   // 7/8
  '\u2151': 0.111,   // 1/9
  '\u2152': 0.1,     // 1/10
};

// ---------------------------------------------------------------------------
// Known units (order matters -- longer strings first to avoid partial matches)
// ---------------------------------------------------------------------------

const UNIT_LIST: string[] = [
  'fluid ounces', 'fluid ounce', 'fl oz\\.?', 'fl\\. oz\\.?',
  'tablespoons?', 'teaspoons?',
  'tbsp\\.?', 'tbs\\.?', 'tsp\\.?',
  'cups?',
  'ounces?', 'pounds?',
  'kilograms?', 'grams?',
  'milliliters?', 'millilitres?', 'liters?', 'litres?',
  'quarts?', 'pints?',
  'lbs?\\.?', 'oz\\.?', 'kg\\.?', 'ml\\.?',
  'pt\\.?', 'qt\\.?',
  'sticks?',
  'pinch(?:es)?', 'dash(?:es)?',
  'c\\.', 'g\\.', 'l\\.', 't\\.', 'T',
  // Single-letter units at the end (must be followed by whitespace)
  'c', 'g', 'l', 't',
];

const UNIT_PATTERN = new RegExp(
  `^(${UNIT_LIST.join('|')})(?:\\s|$)`,
  'i',
);

// ---------------------------------------------------------------------------
// "to taste" / "as needed" pattern
// ---------------------------------------------------------------------------

const VAGUE_QUANTITY_PATTERN = /^(to\s+taste|as\s+needed|a\s+pinch(\s+of)?|a\s+dash(\s+of)?)\s*/i;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Replace unicode fraction characters with their decimal equivalents.
 */
function replaceUnicodeFractions(text: string): string {
  let result = text;
  for (const [char, value] of Object.entries(UNICODE_FRACTIONS)) {
    result = result.replace(new RegExp(char, 'g'), ` ${value}`);
  }
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Parse a fraction string like "1/2" to 0.5.
 */
function parseFraction(str: string): number | null {
  const match = str.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const den = parseInt(match[2], 10);
  if (den === 0) return null;
  return num / den;
}

/**
 * Parse a number that might be a mixed number, decimal, fraction, or whole number.
 * Returns [parsedNumber, remainingText] or null if no number is found.
 */
function parseQuantity(text: string): [number, string] | null {
  let remaining = text.trim();

  // Check for vague quantities first
  const vagueMatch = remaining.match(VAGUE_QUANTITY_PATTERN);
  if (vagueMatch) {
    return null;
  }

  // Try matching a fraction first (e.g., "1/3 cup") before a plain number,
  // so "1/3" isn't consumed as just "1"
  const fractionFirstMatch = remaining.match(/^(\d+\s*\/\s*\d+)\s*/);
  if (fractionFirstMatch) {
    const value = parseFraction(fractionFirstMatch[1]);
    if (value !== null) {
      return [value, remaining.slice(fractionFirstMatch[0].length)];
    }
  }

  // Try matching a leading number (decimal or integer)
  const leadingNumberMatch = remaining.match(/^(\d+(?:\.\d+)?)\s*/);
  if (!leadingNumberMatch) {
    return null;
  }

  const firstNumber = parseFloat(leadingNumberMatch[1]);
  remaining = remaining.slice(leadingNumberMatch[0].length);

  // Check if followed by a fraction (mixed number like "2 1/2")
  const fractionAfterMatch = remaining.match(/^(\d+\s*\/\s*\d+)\s*/);
  if (fractionAfterMatch) {
    const fractionValue = parseFraction(fractionAfterMatch[1]);
    if (fractionValue !== null) {
      return [firstNumber + fractionValue, remaining.slice(fractionAfterMatch[0].length)];
    }
  }

  return [firstNumber, remaining];
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse a single ingredient string into structured data.
 */
export function parseIngredient(text: string): ParsedIngredient {
  const rawText = text.trim();

  // Step 1: Separate prep notes (after first comma)
  let mainPart: string;
  let prepNotes: string | null = null;

  const commaIndex = rawText.indexOf(',');
  if (commaIndex !== -1) {
    mainPart = rawText.slice(0, commaIndex).trim();
    prepNotes = rawText.slice(commaIndex + 1).trim() || null;
  } else {
    mainPart = rawText;
  }

  // Step 2: Normalize unicode fractions
  mainPart = replaceUnicodeFractions(mainPart);

  // Step 3: Check for vague quantities
  const vagueMatch = mainPart.match(VAGUE_QUANTITY_PATTERN);
  if (vagueMatch) {
    const ingredientName = mainPart.slice(vagueMatch[0].length).trim() || mainPart;
    return {
      rawText,
      quantity: null,
      unit: null,
      ingredientName: ingredientName.toLowerCase(),
      prepNotes,
      unitGrams: null,
      isFlour: /flour/i.test(ingredientName),
    };
  }

  // Step 4: Parse quantity
  const quantityResult = parseQuantity(mainPart);
  let quantity: number | null = null;
  let afterQuantity: string;

  if (quantityResult) {
    [quantity, afterQuantity] = quantityResult;
  } else {
    afterQuantity = mainPart;
  }

  // Step 5: Parse unit
  let unit: string | null = null;
  let afterUnit = afterQuantity.trim();

  // Handle special case: "of" after unit (e.g., "2 cups of flour")
  const unitMatch = afterUnit.match(UNIT_PATTERN);
  if (unitMatch) {
    unit = unitMatch[1].replace(/\.$/, ''); // strip trailing dot
    afterUnit = afterUnit.slice(unitMatch[0].length).trim();

    // Remove leading "of" if present
    afterUnit = afterUnit.replace(/^of\s+/i, '');
  }

  // Step 6: The remaining text is the ingredient name
  let ingredientName = afterUnit.trim();

  // If no ingredient name was extracted, use the full main part
  if (!ingredientName) {
    ingredientName = mainPart;
  }

  // Normalize ingredient name
  ingredientName = ingredientName.toLowerCase().replace(/\s+/g, ' ').trim();

  // Step 7: Compute grams
  let unitGrams: number | null = null;
  if (quantity !== null && unit !== null) {
    unitGrams = convertToGrams(quantity, unit, ingredientName);
  } else if (quantity !== null && unit === null) {
    // No unit -- try count-based lookup (e.g., "3 eggs" → 150g)
    unitGrams = countToGrams(quantity, ingredientName);
  }

  // Step 8: Flag flour
  const isFlour = /flour/i.test(ingredientName);

  return {
    rawText,
    quantity,
    unit,
    ingredientName,
    prepNotes,
    unitGrams,
    isFlour,
  };
}

/**
 * Parse multiple ingredient strings.
 */
export function parseIngredients(texts: string[]): ParsedIngredient[] {
  return texts.map(parseIngredient);
}
