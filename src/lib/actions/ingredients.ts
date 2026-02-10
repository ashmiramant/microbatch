"use server";

import { db } from "@/lib/db";
import { ingredients } from "@/lib/db/schema";
import { eq, asc, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────────────────────

type CreateIngredientInput = {
  name: string;
  aliases?: unknown;
  subingredients?: unknown;
  category?:
    | "flour"
    | "sugar_sweetener"
    | "dairy"
    | "fat"
    | "leavening"
    | "salt_seasoning"
    | "fruit_veg"
    | "nut_seed"
    | "liquid"
    | "other"
    | null;
  defaultUnit?: string | null;
  densityGPerMl?: string | null;
  costPerGram?: string | null;
};

type UpdateIngredientInput = Partial<CreateIngredientInput>;

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createIngredient(data: CreateIngredientInput) {
  try {
    const [ingredient] = await db
      .insert(ingredients)
      .values({
        name: data.name,
        aliases: data.aliases,
        subingredients: data.subingredients,
        category: data.category,
        defaultUnit: data.defaultUnit,
        densityGPerMl: data.densityGPerMl,
        costPerGram: data.costPerGram,
      })
      .returning();

    revalidatePath("/pantry");
    return { success: true, data: ingredient };
  } catch (error) {
    console.error("Failed to create ingredient:", error);
    return { success: false, error: "Failed to create ingredient" };
  }
}

export async function updateIngredient(
  id: number,
  data: UpdateIngredientInput
) {
  try {
    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateValues.name = data.name;
    if (data.aliases !== undefined) updateValues.aliases = data.aliases;
    if (data.subingredients !== undefined) updateValues.subingredients = data.subingredients;
    if (data.category !== undefined) updateValues.category = data.category;
    if (data.defaultUnit !== undefined) updateValues.defaultUnit = data.defaultUnit;
    if (data.densityGPerMl !== undefined) updateValues.densityGPerMl = data.densityGPerMl;
    if (data.costPerGram !== undefined) updateValues.costPerGram = data.costPerGram;

    const [ingredient] = await db
      .update(ingredients)
      .set(updateValues)
      .where(eq(ingredients.id, id))
      .returning();

    revalidatePath("/pantry");
    return { success: true, data: ingredient };
  } catch (error) {
    console.error("Failed to update ingredient:", error);
    return { success: false, error: "Failed to update ingredient" };
  }
}

export async function deleteIngredient(id: number) {
  try {
    await db.delete(ingredients).where(eq(ingredients.id, id));
    revalidatePath("/pantry");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete ingredient:", error);
    return { success: false, error: "Failed to delete ingredient" };
  }
}

export async function getIngredient(id: number) {
  try {
    const ingredient = await db.query.ingredients.findFirst({
      where: eq(ingredients.id, id),
    });

    if (!ingredient) {
      return { success: false, error: "Ingredient not found" };
    }

    return { success: true, data: ingredient };
  } catch (error) {
    console.error("Failed to get ingredient:", error);
    return { success: false, error: "Failed to get ingredient" };
  }
}

export async function getIngredients() {
  try {
    const allIngredients = await db.query.ingredients.findMany({
      orderBy: [asc(ingredients.name)],
    });

    return { success: true, data: allIngredients };
  } catch (error) {
    console.error("Failed to get ingredients:", error);
    return { success: false, error: "Failed to get ingredients" };
  }
}

export async function searchIngredients(query: string) {
  try {
    const results = await db
      .select()
      .from(ingredients)
      .where(ilike(ingredients.name, `%${query}%`))
      .orderBy(asc(ingredients.name));

    return { success: true, data: results };
  } catch (error) {
    console.error("Failed to search ingredients:", error);
    return { success: false, error: "Failed to search ingredients" };
  }
}
