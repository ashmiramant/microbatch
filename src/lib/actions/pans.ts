"use server";

import { db } from "@/lib/db";
import { pans } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────────────────────

type CreatePanInput = {
  name: string;
  shape?: "rectangular" | "round" | "square" | "bundt" | "custom" | null;
  lengthCm?: string | null;
  widthCm?: string | null;
  diameterCm?: string | null;
  heightCm?: string | null;
  volumeMl?: string | null;
  material?: string | null;
  notes?: string | null;
};

type UpdatePanInput = Partial<CreatePanInput>;

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createPan(data: CreatePanInput) {
  try {
    const [pan] = await db
      .insert(pans)
      .values({
        name: data.name,
        shape: data.shape,
        lengthCm: data.lengthCm,
        widthCm: data.widthCm,
        diameterCm: data.diameterCm,
        heightCm: data.heightCm,
        volumeMl: data.volumeMl,
        material: data.material,
        notes: data.notes,
      })
      .returning();

    revalidatePath("/pantry/pans");
    return { success: true, data: pan };
  } catch (error) {
    console.error("Failed to create pan:", error);
    return { success: false, error: "Failed to create pan" };
  }
}

export async function updatePan(id: number, data: UpdatePanInput) {
  try {
    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateValues.name = data.name;
    if (data.shape !== undefined) updateValues.shape = data.shape;
    if (data.lengthCm !== undefined) updateValues.lengthCm = data.lengthCm;
    if (data.widthCm !== undefined) updateValues.widthCm = data.widthCm;
    if (data.diameterCm !== undefined) updateValues.diameterCm = data.diameterCm;
    if (data.heightCm !== undefined) updateValues.heightCm = data.heightCm;
    if (data.volumeMl !== undefined) updateValues.volumeMl = data.volumeMl;
    if (data.material !== undefined) updateValues.material = data.material;
    if (data.notes !== undefined) updateValues.notes = data.notes;

    const [pan] = await db
      .update(pans)
      .set(updateValues)
      .where(eq(pans.id, id))
      .returning();

    revalidatePath("/pantry/pans");
    return { success: true, data: pan };
  } catch (error) {
    console.error("Failed to update pan:", error);
    return { success: false, error: "Failed to update pan" };
  }
}

export async function deletePan(id: number) {
  try {
    await db.delete(pans).where(eq(pans.id, id));
    revalidatePath("/pantry/pans");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete pan:", error);
    return { success: false, error: "Failed to delete pan" };
  }
}

export async function getPan(id: number) {
  try {
    const pan = await db.query.pans.findFirst({
      where: eq(pans.id, id),
    });

    if (!pan) {
      return { success: false, error: "Pan not found" };
    }

    return { success: true, data: pan };
  } catch (error) {
    console.error("Failed to get pan:", error);
    return { success: false, error: "Failed to get pan" };
  }
}

export async function getPans() {
  try {
    const allPans = await db.query.pans.findMany({
      orderBy: [asc(pans.name)],
    });

    return { success: true, data: allPans };
  } catch (error) {
    console.error("Failed to get pans:", error);
    return { success: false, error: "Failed to get pans" };
  }
}
