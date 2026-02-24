"use server";

import { db } from "@/lib/db";
import {
  recipes,
  recipeIngredients,
  recipeInstructions,
} from "@/lib/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────────────────────

type RecipeIngredientInput = {
  sortOrder: number;
  rawText: string;
  ingredientId?: number | null;
  quantity?: string | null;
  unit?: string | null;
  unitGrams?: string | null;
  ingredientName?: string | null;
  prepNotes?: string | null;
  isFlour?: boolean | null;
  bakersPercentage?: string | null;
  sectionLabel?: string | null;
};

type RecipeInstructionInput = {
  sortOrder: number;
  stepType?: string | null;
  name?: string | null;
  text: string;
  durationMinutes?: number | null;
  temperatureF?: number | null;
  sectionLabel?: string | null;
};

type CreateRecipeInput = {
  name: string;
  slug?: string;
  sourceUrl?: string | null;
  sourceType?: "ld_json" | "manual_paste" | "manual_entry" | null;
  description?: string | null;
  imageUrl?: string | null;
  price?: string | null;
  yieldQuantity?: string | null;
  yieldUnit?: string | null;
  yieldWeightGrams?: string | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  totalTimeMinutes?: number | null;
  category?: string | null;
  isSourdough?: boolean | null;
  availableForOrder?: boolean | null;
  availableForMainOrder?: boolean | null;
  availableForRootedOrder?: boolean | null;
  defaultPanId?: number | null;
  notes?: string | null;
  rawLdJson?: unknown;
  ingredients: RecipeIngredientInput[];
  instructions: RecipeInstructionInput[];
};

type UpdateRecipeInput = Partial<Omit<CreateRecipeInput, "ingredients" | "instructions">> & {
  ingredients?: RecipeIngredientInput[];
  instructions?: RecipeInstructionInput[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createRecipe(data: CreateRecipeInput) {
  try {
    await ensureRecipeOrderFormColumns();
    const slug = data.slug || generateSlug(data.name);

    const result = await db.transaction(async (tx) => {
      const [recipe] = await tx
        .insert(recipes)
        .values({
          name: data.name,
          slug,
          sourceUrl: data.sourceUrl,
          sourceType: data.sourceType,
          description: data.description,
          imageUrl: data.imageUrl,
          yieldQuantity: data.yieldQuantity,
          yieldUnit: data.yieldUnit,
          yieldWeightGrams: data.yieldWeightGrams,
          prepTimeMinutes: data.prepTimeMinutes,
          cookTimeMinutes: data.cookTimeMinutes,
          totalTimeMinutes: data.totalTimeMinutes,
          category: data.category,
          isSourdough: data.isSourdough,
          availableForOrder: data.availableForOrder,
          availableForMainOrder: data.availableForMainOrder,
          availableForRootedOrder: data.availableForRootedOrder,
          defaultPanId: data.defaultPanId,
          notes: data.notes,
          rawLdJson: data.rawLdJson,
        })
        .returning();

      if (data.ingredients.length > 0) {
        await tx.insert(recipeIngredients).values(
          data.ingredients.map((ing) => ({
            recipeId: recipe.id,
            sortOrder: ing.sortOrder,
            rawText: ing.rawText,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit,
            unitGrams: ing.unitGrams,
            ingredientName: ing.ingredientName,
            prepNotes: ing.prepNotes,
            isFlour: ing.isFlour,
            bakersPercentage: ing.bakersPercentage,
            sectionLabel: ing.sectionLabel,
          }))
        );
      }

      if (data.instructions.length > 0) {
        await tx.insert(recipeInstructions).values(
          data.instructions.map((inst) => ({
            recipeId: recipe.id,
            sortOrder: inst.sortOrder,
            stepType: inst.stepType as typeof recipeInstructions.$inferInsert.stepType,
            name: inst.name,
            text: inst.text,
            durationMinutes: inst.durationMinutes,
            temperatureF: inst.temperatureF,
            sectionLabel: inst.sectionLabel,
          }))
        );
      }

      return recipe;
    });

    revalidatePath("/recipes");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create recipe:", error);
    return { success: false, error: "Failed to create recipe" };
  }
}

export async function updateRecipe(id: number, data: UpdateRecipeInput) {
  try {
    await ensureRecipeOrderFormColumns();
    const result = await db.transaction(async (tx) => {
      const { ingredients, instructions, ...recipeFields } = data;

      // Build update values, only including fields that are present
      const updateValues: Record<string, unknown> = { updatedAt: new Date() };
      if (recipeFields.name !== undefined) updateValues.name = recipeFields.name;
      if (recipeFields.slug !== undefined) updateValues.slug = recipeFields.slug;
      if (recipeFields.sourceUrl !== undefined) updateValues.sourceUrl = recipeFields.sourceUrl;
      if (recipeFields.sourceType !== undefined) updateValues.sourceType = recipeFields.sourceType;
      if (recipeFields.description !== undefined) updateValues.description = recipeFields.description;
      if (recipeFields.imageUrl !== undefined) updateValues.imageUrl = recipeFields.imageUrl;
      if (recipeFields.price !== undefined) updateValues.price = recipeFields.price;
      if (recipeFields.yieldQuantity !== undefined) updateValues.yieldQuantity = recipeFields.yieldQuantity;
      if (recipeFields.yieldUnit !== undefined) updateValues.yieldUnit = recipeFields.yieldUnit;
      if (recipeFields.yieldWeightGrams !== undefined) updateValues.yieldWeightGrams = recipeFields.yieldWeightGrams;
      if (recipeFields.prepTimeMinutes !== undefined) updateValues.prepTimeMinutes = recipeFields.prepTimeMinutes;
      if (recipeFields.cookTimeMinutes !== undefined) updateValues.cookTimeMinutes = recipeFields.cookTimeMinutes;
      if (recipeFields.totalTimeMinutes !== undefined) updateValues.totalTimeMinutes = recipeFields.totalTimeMinutes;
      if (recipeFields.category !== undefined) updateValues.category = recipeFields.category;
      if (recipeFields.isSourdough !== undefined) updateValues.isSourdough = recipeFields.isSourdough;
      if (recipeFields.availableForOrder !== undefined) updateValues.availableForOrder = recipeFields.availableForOrder;
      if (recipeFields.availableForMainOrder !== undefined) {
        updateValues.availableForMainOrder = recipeFields.availableForMainOrder;
      }
      if (recipeFields.availableForRootedOrder !== undefined) {
        updateValues.availableForRootedOrder = recipeFields.availableForRootedOrder;
      }
      if (recipeFields.defaultPanId !== undefined) updateValues.defaultPanId = recipeFields.defaultPanId;
      if (recipeFields.notes !== undefined) updateValues.notes = recipeFields.notes;
      if (recipeFields.rawLdJson !== undefined) updateValues.rawLdJson = recipeFields.rawLdJson;

      const [recipe] = await tx
        .update(recipes)
        .set(updateValues)
        .where(eq(recipes.id, id))
        .returning();

      if (ingredients !== undefined) {
        await tx
          .delete(recipeIngredients)
          .where(eq(recipeIngredients.recipeId, id));

        if (ingredients.length > 0) {
          await tx.insert(recipeIngredients).values(
            ingredients.map((ing) => ({
              recipeId: id,
              sortOrder: ing.sortOrder,
              rawText: ing.rawText,
              ingredientId: ing.ingredientId,
              quantity: ing.quantity,
              unit: ing.unit,
              unitGrams: ing.unitGrams,
              ingredientName: ing.ingredientName,
              prepNotes: ing.prepNotes,
              isFlour: ing.isFlour,
              bakersPercentage: ing.bakersPercentage,
              sectionLabel: ing.sectionLabel,
            }))
          );
        }
      }

      if (instructions !== undefined) {
        await tx
          .delete(recipeInstructions)
          .where(eq(recipeInstructions.recipeId, id));

        if (instructions.length > 0) {
          await tx.insert(recipeInstructions).values(
            instructions.map((inst) => ({
              recipeId: id,
              sortOrder: inst.sortOrder,
              stepType: inst.stepType as typeof recipeInstructions.$inferInsert.stepType,
              name: inst.name,
              text: inst.text,
              durationMinutes: inst.durationMinutes,
              temperatureF: inst.temperatureF,
              sectionLabel: inst.sectionLabel,
            }))
          );
        }
      }

      return recipe;
    });

    revalidatePath("/recipes");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update recipe:", error);
    return { success: false, error: "Failed to update recipe" };
  }
}

export async function deleteRecipe(id: number) {
  try {
    await db.delete(recipes).where(eq(recipes.id, id));
    revalidatePath("/recipes");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete recipe:", error);
    return { success: false, error: "Failed to delete recipe" };
  }
}

export async function getRecipe(id: number) {
  try {
    await ensureRecipeOrderFormColumns();
    const recipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, id),
      with: {
        ingredients: {
          orderBy: [asc(recipeIngredients.sortOrder)],
        },
        instructions: {
          orderBy: [asc(recipeInstructions.sortOrder)],
        },
      },
    });

    if (!recipe) {
      return { success: false, error: "Recipe not found" };
    }

    return { success: true, data: recipe };
  } catch (error) {
    console.error("Failed to get recipe:", error);
    return { success: false, error: "Failed to get recipe" };
  }
}

export async function getRecipes() {
  try {
    await ensureRecipeOrderFormColumns();
    const allRecipes = await db.query.recipes.findMany({
      orderBy: [asc(recipes.name)],
    });

    return { success: true, data: allRecipes };
  } catch (error) {
    console.error("Failed to get recipes:", error);
    return { success: false, error: "Failed to get recipes" };
  }
}

export async function getAvailableRecipes() {
  try {
    await ensureRecipeOrderFormColumns();
    const availableRecipes = await db.query.recipes.findMany({
      where: eq(recipes.availableForOrder, true),
      orderBy: [asc(recipes.name)],
    });

    return { success: true, data: availableRecipes };
  } catch (error) {
    console.error("Failed to get available recipes:", error);
    return { success: false, error: "Failed to get available recipes" };
  }
}

export async function getRecipeBySlug(slug: string) {
  try {
    await ensureRecipeOrderFormColumns();
    const recipe = await db.query.recipes.findFirst({
      where: eq(recipes.slug, slug),
      with: {
        ingredients: {
          orderBy: [asc(recipeIngredients.sortOrder)],
        },
        instructions: {
          orderBy: [asc(recipeInstructions.sortOrder)],
        },
      },
    });

    if (!recipe) {
      return { success: false, error: "Recipe not found" };
    }

    return { success: true, data: recipe };
  } catch (error) {
    console.error("Failed to get recipe by slug:", error);
    return { success: false, error: "Failed to get recipe by slug" };
  }
}

async function ensureRecipeOrderFormColumns() {
  await db.execute(sql`
    ALTER TABLE recipes
    ADD COLUMN IF NOT EXISTS available_for_main_order boolean DEFAULT false
  `);
  await db.execute(sql`
    ALTER TABLE recipes
    ADD COLUMN IF NOT EXISTS available_for_rooted_order boolean DEFAULT false
  `);
  await db.execute(sql`
    UPDATE recipes
    SET available_for_main_order = COALESCE(available_for_main_order, available_for_order)
    WHERE available_for_main_order IS DISTINCT FROM COALESCE(available_for_order, false)
  `);
}

export async function getAvailableRecipesByChannel(
  channel: "main" | "rooted_community"
) {
  try {
    await ensureRecipeOrderFormColumns();

    const availableRecipes = await db.query.recipes.findMany({
      where:
        channel === "rooted_community"
          ? eq(recipes.availableForRootedOrder, true)
          : eq(recipes.availableForMainOrder, true),
      orderBy: [asc(recipes.name)],
    });

    return { success: true, data: availableRecipes };
  } catch (error) {
    console.error("Failed to get available recipes by channel:", error);
    return {
      success: false,
      error: "Failed to get channel-specific available recipes",
    };
  }
}
