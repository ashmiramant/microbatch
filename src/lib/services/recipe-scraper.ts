/**
 * Recipe scraper.
 *
 * Fetches a web page, extracts structured recipe data from LD+JSON
 * (schema.org Recipe type), and returns it in a normalized format.
 */

import * as cheerio from 'cheerio';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScrapedRecipe {
  name: string;
  description: string | null;
  imageUrl: string | null;
  ingredients: string[];
  instructions: Array<{ text: string; name?: string }>;
  yieldText: string | null;
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
  rawLdJson: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// ISO 8601 duration parser
// ---------------------------------------------------------------------------

/**
 * Parse an ISO 8601 duration string (e.g., "PT1H30M") into total minutes.
 * Supports days (D), hours (H), minutes (M), and seconds (S).
 *
 * @returns Total minutes, or null if the string cannot be parsed.
 */
function parseISO8601Duration(duration: string | undefined | null): number | null {
  if (!duration || typeof duration !== 'string') return null;

  const match = duration.match(
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/,
  );
  if (!match) return null;

  const days = parseInt(match[1] || '0', 10);
  const hours = parseInt(match[2] || '0', 10);
  const minutes = parseInt(match[3] || '0', 10);
  const seconds = parseInt(match[4] || '0', 10);

  return days * 1440 + hours * 60 + minutes + Math.round(seconds / 60);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize an image field from LD+JSON which may be a string, an object
 * with a `url` property, or an array of either.
 */
function extractImageUrl(image: unknown): string | null {
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) {
    return extractImageUrl(image[0]);
  }
  if (image && typeof image === 'object' && 'url' in image) {
    return typeof (image as Record<string, unknown>).url === 'string'
      ? (image as Record<string, unknown>).url as string
      : null;
  }
  return null;
}

/**
 * Normalize the `recipeInstructions` field which can be:
 * - A string
 * - An array of strings
 * - An array of HowToStep objects ({ @type: "HowToStep", text: "..." })
 * - An array of HowToSection objects containing itemListElement arrays
 */
function extractInstructions(
  raw: unknown,
): Array<{ text: string; name?: string }> {
  if (!raw) return [];

  if (typeof raw === 'string') {
    return raw
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ text }));
  }

  if (!Array.isArray(raw)) return [];

  const results: Array<{ text: string; name?: string }> = [];

  for (const item of raw) {
    if (typeof item === 'string') {
      results.push({ text: item.trim() });
    } else if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const type = obj['@type'];

      if (type === 'HowToStep') {
        const text =
          typeof obj.text === 'string'
            ? obj.text.trim()
            : typeof obj.description === 'string'
              ? obj.description.trim()
              : '';
        if (text) {
          results.push({
            text,
            name: typeof obj.name === 'string' ? obj.name : undefined,
          });
        }
      } else if (type === 'HowToSection') {
        // Sections contain nested steps
        const nestedItems = obj.itemListElement;
        if (Array.isArray(nestedItems)) {
          const nested = extractInstructions(nestedItems);
          results.push(...nested);
        }
      } else if (obj.text && typeof obj.text === 'string') {
        // Fallback for step-like objects without explicit @type
        results.push({
          text: obj.text.trim(),
          name: typeof obj.name === 'string' ? obj.name : undefined,
        });
      }
    }
  }

  return results;
}

/**
 * Normalize the `recipeIngredient` field.
 */
function extractIngredients(raw: unknown): string[] {
  if (!raw) return [];
  if (typeof raw === 'string') {
    return raw
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is string => typeof item === 'string')
      .map((s) => s.trim());
  }
  return [];
}

/**
 * Normalize the `recipeYield` field which can be a string or array.
 */
function extractYield(raw: unknown): string | null {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw.length > 0) {
    return typeof raw[0] === 'string' ? raw[0] : String(raw[0]);
  }
  if (typeof raw === 'number') return String(raw);
  return null;
}

/**
 * Find a Recipe object within a parsed LD+JSON value.
 * Handles plain objects, arrays, and @graph structures.
 */
function findRecipeObject(
  data: unknown,
): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeObject(item);
      if (found) return found;
    }
    return null;
  }

  const obj = data as Record<string, unknown>;

  // Check if this object itself is a Recipe
  const type = obj['@type'];
  if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) {
    return obj;
  }

  // Check @graph
  if (Array.isArray(obj['@graph'])) {
    for (const item of obj['@graph']) {
      const found = findRecipeObject(item);
      if (found) return found;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Scrape a recipe from a URL by extracting LD+JSON structured data.
 *
 * @param url - The full URL of the recipe page.
 * @returns A structured recipe object.
 * @throws Error if the page cannot be fetched or no LD+JSON recipe is found.
 */
export async function scrapeRecipe(url: string): Promise<ScrapedRecipe> {
  // Fetch the HTML
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; MicroBatch Recipe Scraper/1.0)',
      Accept: 'text/html',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch recipe page: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Find all LD+JSON script tags
  const ldJsonScripts = $('script[type="application/ld+json"]');
  let recipeData: Record<string, unknown> | null = null;

  ldJsonScripts.each((_index, element) => {
    if (recipeData) return; // Already found

    const scriptContent = $(element).html();
    if (!scriptContent) return;

    try {
      const parsed = JSON.parse(scriptContent);
      const found = findRecipeObject(parsed);
      if (found) {
        recipeData = found;
      }
    } catch {
      // Invalid JSON -- skip this script tag
    }
  });

  if (!recipeData) {
    throw new Error(
      `No structured recipe data (LD+JSON with @type "Recipe") found at: ${url}`,
    );
  }

  const recipe = recipeData as Record<string, unknown>;

  return {
    name: typeof recipe.name === 'string' ? recipe.name : 'Untitled Recipe',
    description:
      typeof recipe.description === 'string' ? recipe.description : null,
    imageUrl: extractImageUrl(recipe.image),
    ingredients: extractIngredients(recipe.recipeIngredient),
    instructions: extractInstructions(recipe.recipeInstructions),
    yieldText: extractYield(recipe.recipeYield),
    prepTime: parseISO8601Duration(recipe.prepTime as string | undefined),
    cookTime: parseISO8601Duration(recipe.cookTime as string | undefined),
    totalTime: parseISO8601Duration(recipe.totalTime as string | undefined),
    rawLdJson: recipe,
  };
}
