/**
 * Density table for common baking ingredients.
 * Densities are expressed in grams per milliliter (g/mL).
 * Derived from weight-per-cup measurements using 1 US cup = 240 mL.
 */

export const DENSITY_TABLE: Map<string, number> = new Map([
  // Flours
  ['bread flour', 0.529],
  ['all-purpose flour', 0.521],
  ['whole wheat flour', 0.500],
  ['cake flour', 0.488],
  ['pastry flour', 0.504],
  ['semolina', 0.700],
  ['rye flour', 0.533],
  ['almond flour', 0.400],
  ['coconut flour', 0.533],
  ['rice flour', 0.525],
  ['buckwheat flour', 0.500],
  ['spelt flour', 0.508],
  ['oat flour', 0.400],
  ['cornmeal', 0.633],
  ['malted barley flour', 0.567],
  ['vital wheat gluten', 0.583],

  // Sugars & sweeteners
  ['granulated sugar', 0.833],
  ['brown sugar', 0.917],
  ['powdered sugar', 0.500],
  ['honey', 1.417],
  ['molasses', 1.375],
  ['maple syrup', 1.375],
  ['corn syrup', 1.375],
  ['agave nectar', 1.375],

  // Fats & oils
  ['butter', 0.946],
  ['vegetable oil', 0.917],
  ['olive oil', 0.904],
  ['coconut oil', 0.917],
  ['shortening', 0.817],
  ['lard', 0.871],

  // Dairy
  ['milk', 1.025],
  ['heavy cream', 0.988],
  ['cream cheese', 0.960],
  ['sour cream', 0.958],
  ['yogurt', 1.025],
  ['buttermilk', 1.025],
  ['milk powder', 0.500],
  ['evaporated milk', 1.050],
  ['condensed milk', 1.313],

  // Liquids
  ['water', 0.988],
  ['eggs (whole)', 1.033],
  ['vanilla extract', 0.875],

  // Leaveners & salts
  ['baking powder', 0.921],
  ['baking soda', 0.946],
  ['active dry yeast', 0.583],
  ['instant yeast', 0.542],
  ['salt (table)', 1.200],
  ['salt (kosher)', 0.600],
  ['cream of tartar', 0.750],

  // Starches & grains
  ['cornstarch', 0.542],
  ['oats', 0.333],
  ['tapioca starch', 0.500],

  // Cocoa & chocolate
  ['cocoa powder', 0.354],
  ['chocolate chips', 0.708],

  // Spices
  ['cinnamon', 0.525],
  ['ground cinnamon', 0.525],
  ['ground ginger', 0.467],
  ['ground nutmeg', 0.467],
  ['ground cloves', 0.467],
  ['ground allspice', 0.467],
  ['ground cardamom', 0.467],
  ['paprika', 0.467],
  ['ground cumin', 0.467],
  ['chili powder', 0.467],
  ['ground turmeric', 0.467],
  ['black pepper', 0.467],
  ['garlic powder', 0.467],
  ['onion powder', 0.467],

  // Nuts & dried fruits
  ['peanut butter', 1.063],
  ['raisins', 0.604],
  ['walnuts (chopped)', 0.483],
  ['pecans (chopped)', 0.458],
  ['almonds (sliced)', 0.383],
  ['coconut (shredded)', 0.375],

  // Starters & cultures
  ['sourdough starter', 1.025],
  ['sourdough discard', 1.025],
]);

/**
 * Common aliases and abbreviations that map to canonical ingredient names.
 */
const ALIASES: Map<string, string> = new Map([
  // Flour aliases
  ['ap flour', 'all-purpose flour'],
  ['a.p. flour', 'all-purpose flour'],
  ['a-p flour', 'all-purpose flour'],
  ['plain flour', 'all-purpose flour'],
  ['white flour', 'all-purpose flour'],
  ['flour', 'all-purpose flour'],
  ['strong flour', 'bread flour'],
  ['high gluten flour', 'bread flour'],
  ['ww flour', 'whole wheat flour'],
  ['wholewheat flour', 'whole wheat flour'],
  ['wheat flour', 'whole wheat flour'],
  ['self-rising flour', 'all-purpose flour'],
  ['self rising flour', 'all-purpose flour'],
  ['gluten', 'vital wheat gluten'],
  ['wheat gluten', 'vital wheat gluten'],

  // Sugar aliases
  ['sugar', 'granulated sugar'],
  ['white sugar', 'granulated sugar'],
  ['caster sugar', 'granulated sugar'],
  ['castor sugar', 'granulated sugar'],
  ['confectioners sugar', 'powdered sugar'],
  ['confectioners\' sugar', 'powdered sugar'],
  ['icing sugar', 'powdered sugar'],
  ['10x sugar', 'powdered sugar'],
  ['light brown sugar', 'brown sugar'],
  ['dark brown sugar', 'brown sugar'],
  ['packed brown sugar', 'brown sugar'],
  ['demerara sugar', 'brown sugar'],
  ['turbinado sugar', 'brown sugar'],
  ['muscovado sugar', 'brown sugar'],

  // Fat aliases
  ['unsalted butter', 'butter'],
  ['salted butter', 'butter'],
  ['melted butter', 'butter'],
  ['softened butter', 'butter'],
  ['cold butter', 'butter'],
  ['canola oil', 'vegetable oil'],
  ['sunflower oil', 'vegetable oil'],
  ['cooking oil', 'vegetable oil'],
  ['oil', 'vegetable oil'],
  ['extra virgin olive oil', 'olive oil'],
  ['evoo', 'olive oil'],

  // Dairy aliases
  ['whole milk', 'milk'],
  ['2% milk', 'milk'],
  ['skim milk', 'milk'],
  ['nonfat milk', 'milk'],
  ['whipping cream', 'heavy cream'],
  ['heavy whipping cream', 'heavy cream'],
  ['cream', 'heavy cream'],
  ['greek yogurt', 'yogurt'],
  ['plain yogurt', 'yogurt'],
  ['nonfat dry milk', 'milk powder'],
  ['dry milk powder', 'milk powder'],
  ['powdered milk', 'milk powder'],
  ['nonfat milk powder', 'milk powder'],

  // Egg aliases
  ['egg', 'eggs (whole)'],
  ['eggs', 'eggs (whole)'],
  ['whole egg', 'eggs (whole)'],
  ['whole eggs', 'eggs (whole)'],
  ['large egg', 'eggs (whole)'],
  ['large eggs', 'eggs (whole)'],

  // Leavener aliases
  ['yeast', 'active dry yeast'],
  ['dry yeast', 'active dry yeast'],
  ['rapid rise yeast', 'instant yeast'],
  ['quick yeast', 'instant yeast'],
  ['fast acting yeast', 'instant yeast'],
  ['soda', 'baking soda'],
  ['bicarb', 'baking soda'],
  ['bicarbonate of soda', 'baking soda'],
  ['baking powder', 'baking powder'],

  // Salt aliases
  ['salt', 'salt (table)'],
  ['table salt', 'salt (table)'],
  ['fine salt', 'salt (table)'],
  ['sea salt', 'salt (table)'],
  ['kosher salt', 'salt (kosher)'],
  ['coarse salt', 'salt (kosher)'],
  ['diamond crystal', 'salt (kosher)'],

  // Misc aliases
  ['vanilla', 'vanilla extract'],
  ['pure vanilla extract', 'vanilla extract'],
  ['dutch process cocoa', 'cocoa powder'],
  ['unsweetened cocoa', 'cocoa powder'],
  ['cocoa', 'cocoa powder'],
  ['rolled oats', 'oats'],
  ['old-fashioned oats', 'oats'],
  ['old fashioned oats', 'oats'],
  ['quick oats', 'oats'],
  ['corn starch', 'cornstarch'],
  ['peanut butter', 'peanut butter'],
  ['pb', 'peanut butter'],
  ['shredded coconut', 'coconut (shredded)'],
  ['desiccated coconut', 'coconut (shredded)'],
  ['chocolate chips', 'chocolate chips'],
  ['semi-sweet chocolate chips', 'chocolate chips'],
  ['semisweet chocolate chips', 'chocolate chips'],
  ['chopped walnuts', 'walnuts (chopped)'],
  ['walnut pieces', 'walnuts (chopped)'],
  ['chopped pecans', 'pecans (chopped)'],
  ['pecan pieces', 'pecans (chopped)'],
  ['sliced almonds', 'almonds (sliced)'],
  ['barley malt flour', 'malted barley flour'],
  ['malt flour', 'malted barley flour'],
  ['diastatic malt', 'malted barley flour'],

  // Spice aliases
  ['cinnamon', 'cinnamon'],

  // Starter aliases
  ['sourdough starter discard', 'sourdough starter'],
  ['starter discard', 'sourdough starter'],
  ['sourdough discard', 'sourdough discard'],
  ['active starter', 'sourdough starter'],
  ['active sourdough starter', 'sourdough starter'],
  ['fed starter', 'sourdough starter'],
  ['levain', 'sourdough starter'],

  // Salt aliases
  ['fine sea salt', 'salt (table)'],
]);

/**
 * Normalize an ingredient name for lookup: lowercase, trim, collapse whitespace.
 */
function normalize(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Look up the density (g/mL) for a given ingredient name.
 * Performs fuzzy matching through normalization, alias resolution,
 * and substring matching against the density table.
 *
 * @returns density in g/mL, or null if not found
 */
export function getDensity(ingredientName: string): number | null {
  const normalized = normalize(ingredientName);

  // Direct lookup
  const direct = DENSITY_TABLE.get(normalized);
  if (direct !== undefined) return direct;

  // Alias lookup
  const aliased = ALIASES.get(normalized);
  if (aliased !== undefined) {
    const density = DENSITY_TABLE.get(aliased);
    if (density !== undefined) return density;
  }

  // Substring match: check if any density table key is contained in the input
  // or if the input is contained in any key
  for (const [key, density] of DENSITY_TABLE) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return density;
    }
  }

  // Substring match against aliases
  for (const [alias, canonical] of ALIASES) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      const density = DENSITY_TABLE.get(canonical);
      if (density !== undefined) return density;
    }
  }

  return null;
}
