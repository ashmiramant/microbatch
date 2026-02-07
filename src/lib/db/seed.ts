import { db } from "./index";
import { ingredients, pans } from "./schema";

const SEED_INGREDIENTS = [
  { name: "bread flour", category: "flour" as const, defaultUnit: "g", densityGPerMl: "0.529", aliases: ["strong flour", "high-gluten flour"] },
  { name: "all-purpose flour", category: "flour" as const, defaultUnit: "g", densityGPerMl: "0.521", aliases: ["AP flour", "plain flour"] },
  { name: "whole wheat flour", category: "flour" as const, defaultUnit: "g", densityGPerMl: "0.500", aliases: ["wholemeal flour", "whole grain flour"] },
  { name: "rye flour", category: "flour" as const, defaultUnit: "g", densityGPerMl: "0.533", aliases: ["dark rye flour"] },
  { name: "semolina flour", category: "flour" as const, defaultUnit: "g", densityGPerMl: "0.700", aliases: ["semolina", "durum flour"] },
  { name: "almond flour", category: "flour" as const, defaultUnit: "g", densityGPerMl: "0.400", aliases: ["almond meal", "ground almonds"] },
  { name: "coconut flour", category: "flour" as const, defaultUnit: "g", densityGPerMl: "0.533", aliases: [] },
  { name: "cake flour", category: "flour" as const, defaultUnit: "g", densityGPerMl: "0.483", aliases: ["soft flour"] },
  { name: "pastry flour", category: "flour" as const, defaultUnit: "g", densityGPerMl: "0.500", aliases: [] },
  { name: "spelt flour", category: "flour" as const, defaultUnit: "g", densityGPerMl: "0.508", aliases: [] },
  { name: "vital wheat gluten", category: "flour" as const, defaultUnit: "g", densityGPerMl: "0.583", aliases: ["wheat gluten"] },
  { name: "malted barley flour", category: "flour" as const, defaultUnit: "g", densityGPerMl: "0.567", aliases: ["diastatic malt powder"] },
  { name: "cornstarch", category: "flour" as const, defaultUnit: "g", densityGPerMl: "0.542", aliases: ["corn starch", "cornflour"] },
  { name: "granulated sugar", category: "sugar_sweetener" as const, defaultUnit: "g", densityGPerMl: "0.833", aliases: ["sugar", "white sugar", "cane sugar"] },
  { name: "brown sugar", category: "sugar_sweetener" as const, defaultUnit: "g", densityGPerMl: "0.917", aliases: ["light brown sugar", "dark brown sugar", "packed brown sugar"] },
  { name: "powdered sugar", category: "sugar_sweetener" as const, defaultUnit: "g", densityGPerMl: "0.500", aliases: ["confectioners sugar", "icing sugar", "confectioners' sugar"] },
  { name: "honey", category: "sugar_sweetener" as const, defaultUnit: "g", densityGPerMl: "1.417", aliases: [] },
  { name: "maple syrup", category: "sugar_sweetener" as const, defaultUnit: "g", densityGPerMl: "1.375", aliases: ["pure maple syrup"] },
  { name: "molasses", category: "sugar_sweetener" as const, defaultUnit: "g", densityGPerMl: "1.375", aliases: ["blackstrap molasses"] },
  { name: "corn syrup", category: "sugar_sweetener" as const, defaultUnit: "g", densityGPerMl: "1.375", aliases: ["light corn syrup"] },
  { name: "butter", category: "dairy" as const, defaultUnit: "g", densityGPerMl: "0.946", aliases: ["unsalted butter", "salted butter"] },
  { name: "milk", category: "dairy" as const, defaultUnit: "g", densityGPerMl: "1.025", aliases: ["whole milk"] },
  { name: "heavy cream", category: "dairy" as const, defaultUnit: "g", densityGPerMl: "0.988", aliases: ["heavy whipping cream", "whipping cream", "double cream"] },
  { name: "cream cheese", category: "dairy" as const, defaultUnit: "g", densityGPerMl: "0.960", aliases: [] },
  { name: "sour cream", category: "dairy" as const, defaultUnit: "g", densityGPerMl: "0.958", aliases: [] },
  { name: "yogurt", category: "dairy" as const, defaultUnit: "g", densityGPerMl: "1.025", aliases: ["plain yogurt", "greek yogurt"] },
  { name: "buttermilk", category: "dairy" as const, defaultUnit: "g", densityGPerMl: "1.025", aliases: [] },
  { name: "milk powder", category: "dairy" as const, defaultUnit: "g", densityGPerMl: "0.500", aliases: ["dry milk powder", "nonfat dry milk"] },
  { name: "eggs", category: "dairy" as const, defaultUnit: "each", densityGPerMl: "1.033", aliases: ["egg", "large eggs", "large egg"] },
  { name: "vegetable oil", category: "fat" as const, defaultUnit: "g", densityGPerMl: "0.917", aliases: ["canola oil", "neutral oil"] },
  { name: "olive oil", category: "fat" as const, defaultUnit: "g", densityGPerMl: "0.904", aliases: ["extra virgin olive oil", "EVOO"] },
  { name: "coconut oil", category: "fat" as const, defaultUnit: "g", densityGPerMl: "0.917", aliases: [] },
  { name: "shortening", category: "fat" as const, defaultUnit: "g", densityGPerMl: "0.875", aliases: ["vegetable shortening"] },
  { name: "lard", category: "fat" as const, defaultUnit: "g", densityGPerMl: "0.917", aliases: [] },
  { name: "active dry yeast", category: "leavening" as const, defaultUnit: "g", densityGPerMl: "0.583", aliases: ["dry yeast"] },
  { name: "instant yeast", category: "leavening" as const, defaultUnit: "g", densityGPerMl: "0.542", aliases: ["rapid rise yeast", "quick yeast", "instant dry yeast"] },
  { name: "baking powder", category: "leavening" as const, defaultUnit: "g", densityGPerMl: "0.921", aliases: [] },
  { name: "baking soda", category: "leavening" as const, defaultUnit: "g", densityGPerMl: "0.946", aliases: ["bicarbonate of soda", "sodium bicarbonate"] },
  { name: "sourdough starter", category: "leavening" as const, defaultUnit: "g", densityGPerMl: "1.000", aliases: ["levain", "starter", "sourdough culture", "natural leaven"] },
  { name: "table salt", category: "salt_seasoning" as const, defaultUnit: "g", densityGPerMl: "1.200", aliases: ["salt", "fine salt"] },
  { name: "kosher salt", category: "salt_seasoning" as const, defaultUnit: "g", densityGPerMl: "0.600", aliases: ["diamond crystal kosher salt"] },
  { name: "sea salt", category: "salt_seasoning" as const, defaultUnit: "g", densityGPerMl: "1.000", aliases: ["fine sea salt", "flaky sea salt"] },
  { name: "vanilla extract", category: "salt_seasoning" as const, defaultUnit: "g", densityGPerMl: "0.875", aliases: ["pure vanilla extract", "vanilla"] },
  { name: "cinnamon", category: "salt_seasoning" as const, defaultUnit: "g", densityGPerMl: "0.550", aliases: ["ground cinnamon"] },
  { name: "cocoa powder", category: "other" as const, defaultUnit: "g", densityGPerMl: "0.354", aliases: ["unsweetened cocoa powder", "dutch process cocoa"] },
  { name: "chocolate chips", category: "other" as const, defaultUnit: "g", densityGPerMl: "0.708", aliases: ["semi-sweet chocolate chips", "dark chocolate chips"] },
  { name: "water", category: "liquid" as const, defaultUnit: "g", densityGPerMl: "0.988", aliases: ["warm water", "cold water", "lukewarm water", "room temperature water"] },
  { name: "oats", category: "other" as const, defaultUnit: "g", densityGPerMl: "0.333", aliases: ["rolled oats", "old fashioned oats"] },
  { name: "raisins", category: "fruit_veg" as const, defaultUnit: "g", densityGPerMl: "0.604", aliases: ["golden raisins"] },
  { name: "walnuts", category: "nut_seed" as const, defaultUnit: "g", densityGPerMl: "0.483", aliases: ["chopped walnuts", "walnut pieces"] },
  { name: "pecans", category: "nut_seed" as const, defaultUnit: "g", densityGPerMl: "0.458", aliases: ["chopped pecans", "pecan pieces"] },
  { name: "almonds", category: "nut_seed" as const, defaultUnit: "g", densityGPerMl: "0.383", aliases: ["sliced almonds", "slivered almonds"] },
  { name: "peanut butter", category: "nut_seed" as const, defaultUnit: "g", densityGPerMl: "1.063", aliases: ["creamy peanut butter"] },
  { name: "coconut", category: "other" as const, defaultUnit: "g", densityGPerMl: "0.375", aliases: ["shredded coconut", "desiccated coconut", "coconut flakes"] },
  { name: "sesame seeds", category: "nut_seed" as const, defaultUnit: "g", densityGPerMl: "0.583", aliases: ["white sesame seeds"] },
  { name: "flax seeds", category: "nut_seed" as const, defaultUnit: "g", densityGPerMl: "0.667", aliases: ["flaxseed", "ground flax"] },
  { name: "poppy seeds", category: "nut_seed" as const, defaultUnit: "g", densityGPerMl: "0.583", aliases: [] },
  { name: "sunflower seeds", category: "nut_seed" as const, defaultUnit: "g", densityGPerMl: "0.542", aliases: [] },
];

const SEED_PANS = [
  { name: '9×5 Loaf Pan', shape: 'rectangular' as const, lengthCm: "23", widthCm: "13", heightCm: "7", volumeMl: "2093", material: 'aluminum', notes: 'Standard bread loaf pan' },
  { name: '8.5×4.5 Loaf Pan', shape: 'rectangular' as const, lengthCm: "22", widthCm: "11", heightCm: "6", volumeMl: "1452", material: 'aluminum', notes: 'Small bread loaf pan' },
  { name: '9" Round Cake Pan', shape: 'round' as const, diameterCm: "23", heightCm: "5", volumeMl: "2073", material: 'aluminum', notes: '9-inch round, 2 inches deep' },
  { name: '10" Cast Iron Skillet', shape: 'round' as const, diameterCm: "25", heightCm: "5", volumeMl: "2454", material: 'cast iron', notes: 'For skillet breads and cornbread' },
  { name: 'Half Sheet Pan', shape: 'rectangular' as const, lengthCm: "46", widthCm: "33", heightCm: "2.5", volumeMl: "3795", material: 'aluminum', notes: '18×13 inch standard half sheet' },
  { name: '5.5qt Dutch Oven', shape: 'round' as const, diameterCm: "26", heightCm: "11", volumeMl: "5839", material: 'cast iron', notes: 'For artisan bread baking' },
  { name: '9×9 Square Pan', shape: 'square' as const, lengthCm: "23", widthCm: "23", heightCm: "5", volumeMl: "2645", material: 'aluminum', notes: 'For brownies and bar cookies' },
  { name: 'Pullman Loaf Pan', shape: 'rectangular' as const, lengthCm: "33", widthCm: "10", heightCm: "10", volumeMl: "3300", material: 'aluminum', notes: '13×4×4 inch with lid for pain de mie' },
];

async function seed() {
  console.log("🌱 Seeding database...");

  console.log("  Seeding ingredients...");
  for (const ing of SEED_INGREDIENTS) {
    await db
      .insert(ingredients)
      .values({
        name: ing.name,
        aliases: ing.aliases,
        category: ing.category,
        defaultUnit: ing.defaultUnit,
        densityGPerMl: ing.densityGPerMl,
      })
      .onConflictDoNothing({ target: ingredients.name });
  }
  console.log(`  ✓ ${SEED_INGREDIENTS.length} ingredients seeded`);

  console.log("  Seeding pans...");
  for (const pan of SEED_PANS) {
    await db
      .insert(pans)
      .values({
        name: pan.name,
        shape: pan.shape,
        lengthCm: pan.lengthCm,
        widthCm: pan.widthCm,
        diameterCm: pan.diameterCm ?? null,
        heightCm: pan.heightCm,
        volumeMl: pan.volumeMl,
        material: pan.material,
        notes: pan.notes,
      })
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${SEED_PANS.length} pans seeded`);

  console.log("✅ Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
