"use server";

import { db } from "@/lib/db";
import {
  packagingTypes,
  recipePackaging,
  shoppingLists,
  shoppingListItems,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────────────────────

type CreatePackagingTypeInput = {
  name: string;
  category?: "bag" | "box" | "wrapper" | "sticker" | "label" | "tie" | "other" | null;
  costPerUnit?: string | null;
  currentStock?: number | null;
  reorderThreshold?: number | null;
  supplierUrl?: string | null;
  notes?: string | null;
};

type UpdatePackagingTypeInput = Partial<CreatePackagingTypeInput>;

type ShoppingListItemInput = {
  ingredientId?: number | null;
  name: string;
  quantityNeededGrams?: string | null;
  quantityDisplay?: string | null;
  isPurchased?: boolean | null;
  notes?: string | null;
};

type CreateShoppingListInput = {
  name: string;
  productionRunId?: number | null;
  status?: "draft" | "active" | "completed" | null;
  items: ShoppingListItemInput[];
};

// ─── Packaging Types ─────────────────────────────────────────────────────────

export async function createPackagingType(data: CreatePackagingTypeInput) {
  try {
    const [packagingType] = await db
      .insert(packagingTypes)
      .values({
        name: data.name,
        category: data.category,
        costPerUnit: data.costPerUnit,
        currentStock: data.currentStock,
        reorderThreshold: data.reorderThreshold,
        supplierUrl: data.supplierUrl,
        notes: data.notes,
      })
      .returning();

    revalidatePath("/pantry/packaging");
    return { success: true, data: packagingType };
  } catch (error) {
    console.error("Failed to create packaging type:", error);
    return { success: false, error: "Failed to create packaging type" };
  }
}

export async function updatePackagingType(
  id: number,
  data: UpdatePackagingTypeInput
) {
  try {
    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateValues.name = data.name;
    if (data.category !== undefined) updateValues.category = data.category;
    if (data.costPerUnit !== undefined) updateValues.costPerUnit = data.costPerUnit;
    if (data.currentStock !== undefined) updateValues.currentStock = data.currentStock;
    if (data.reorderThreshold !== undefined) updateValues.reorderThreshold = data.reorderThreshold;
    if (data.supplierUrl !== undefined) updateValues.supplierUrl = data.supplierUrl;
    if (data.notes !== undefined) updateValues.notes = data.notes;

    const [packagingType] = await db
      .update(packagingTypes)
      .set(updateValues)
      .where(eq(packagingTypes.id, id))
      .returning();

    revalidatePath("/pantry/packaging");
    return { success: true, data: packagingType };
  } catch (error) {
    console.error("Failed to update packaging type:", error);
    return { success: false, error: "Failed to update packaging type" };
  }
}

export async function deletePackagingType(id: number) {
  try {
    await db.delete(packagingTypes).where(eq(packagingTypes.id, id));
    revalidatePath("/pantry/packaging");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete packaging type:", error);
    return { success: false, error: "Failed to delete packaging type" };
  }
}

export async function getPackagingTypes() {
  try {
    const allTypes = await db.query.packagingTypes.findMany({
      orderBy: (packagingTypes, { asc }) => [asc(packagingTypes.name)],
    });

    return { success: true, data: allTypes };
  } catch (error) {
    console.error("Failed to get packaging types:", error);
    return { success: false, error: "Failed to get packaging types" };
  }
}

export async function updatePackagingStock(id: number, newStock: number) {
  try {
    const [packagingType] = await db
      .update(packagingTypes)
      .set({ currentStock: newStock, updatedAt: new Date() })
      .where(eq(packagingTypes.id, id))
      .returning();

    revalidatePath("/pantry/packaging");
    return { success: true, data: packagingType };
  } catch (error) {
    console.error("Failed to update packaging stock:", error);
    return { success: false, error: "Failed to update packaging stock" };
  }
}

// ─── Recipe Packaging ────────────────────────────────────────────────────────

export async function linkRecipePackaging(
  recipeId: number,
  packagingTypeId: number,
  quantityPerYield: number = 1
) {
  try {
    const [link] = await db
      .insert(recipePackaging)
      .values({
        recipeId,
        packagingTypeId,
        quantityPerYield,
      })
      .returning();

    revalidatePath("/pantry/packaging");
    revalidatePath("/production");
    return { success: true, data: link };
  } catch (error) {
    console.error("Failed to link recipe packaging:", error);
    return { success: false, error: "Failed to link recipe packaging" };
  }
}

export async function unlinkRecipePackaging(id: number) {
  try {
    await db.delete(recipePackaging).where(eq(recipePackaging.id, id));
    revalidatePath("/pantry/packaging");
    revalidatePath("/production");
    return { success: true };
  } catch (error) {
    console.error("Failed to unlink recipe packaging:", error);
    return { success: false, error: "Failed to unlink recipe packaging" };
  }
}

export async function getRecipePackaging(recipeId: number) {
  try {
    const packaging = await db.query.recipePackaging.findMany({
      where: eq(recipePackaging.recipeId, recipeId),
      with: {
        packagingType: true,
      },
    });

    return { success: true, data: packaging };
  } catch (error) {
    console.error("Failed to get recipe packaging:", error);
    return { success: false, error: "Failed to get recipe packaging" };
  }
}

// ─── Shopping Lists ──────────────────────────────────────────────────────────

export async function createShoppingList(data: CreateShoppingListInput) {
  try {
    const result = await db.transaction(async (tx) => {
      const [list] = await tx
        .insert(shoppingLists)
        .values({
          name: data.name,
          productionRunId: data.productionRunId,
          status: data.status,
        })
        .returning();

      if (data.items.length > 0) {
        await tx.insert(shoppingListItems).values(
          data.items.map((item) => ({
            shoppingListId: list.id,
            ingredientId: item.ingredientId,
            name: item.name,
            quantityNeededGrams: item.quantityNeededGrams,
            quantityDisplay: item.quantityDisplay,
            isPurchased: item.isPurchased,
            notes: item.notes,
          }))
        );
      }

      return list;
    });

    revalidatePath("/pantry/packaging");
    revalidatePath("/production");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create shopping list:", error);
    return { success: false, error: "Failed to create shopping list" };
  }
}

export async function updateShoppingListItem(
  itemId: number,
  isPurchased: boolean
) {
  try {
    const [item] = await db
      .update(shoppingListItems)
      .set({ isPurchased, updatedAt: new Date() })
      .where(eq(shoppingListItems.id, itemId))
      .returning();

    revalidatePath("/pantry/packaging");
    revalidatePath("/production");
    return { success: true, data: item };
  } catch (error) {
    console.error("Failed to update shopping list item:", error);
    return { success: false, error: "Failed to update shopping list item" };
  }
}

export async function getShoppingList(id: number) {
  try {
    const list = await db.query.shoppingLists.findFirst({
      where: eq(shoppingLists.id, id),
      with: {
        items: {
          with: {
            ingredient: true,
          },
        },
        productionRun: true,
      },
    });

    if (!list) {
      return { success: false, error: "Shopping list not found" };
    }

    return { success: true, data: list };
  } catch (error) {
    console.error("Failed to get shopping list:", error);
    return { success: false, error: "Failed to get shopping list" };
  }
}

export async function getShoppingLists() {
  try {
    const allLists = await db.query.shoppingLists.findMany({
      orderBy: [desc(shoppingLists.createdAt)],
      with: {
        items: true,
        productionRun: true,
      },
    });

    return { success: true, data: allLists };
  } catch (error) {
    console.error("Failed to get shopping lists:", error);
    return { success: false, error: "Failed to get shopping lists" };
  }
}
