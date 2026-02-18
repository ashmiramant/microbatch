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

const STANDARD_PANS: CreatePanInput[] = [
  {
    name: 'Loaf Pan 9" x 5" x 3"',
    shape: "rectangular",
    lengthCm: "22.9",
    widthCm: "12.7",
    heightCm: "7.6",
    volumeMl: "2210",
    notes: "Standard loaf pan",
  },
  {
    name: 'Loaf Pan 8.5" x 4.5" x 2.75"',
    shape: "rectangular",
    lengthCm: "21.6",
    widthCm: "11.4",
    heightCm: "7.0",
    volumeMl: "1720",
    notes: "Smaller loaf pan",
  },
  {
    name: 'Cake Pan Round 8" x 2"',
    shape: "round",
    diameterCm: "20.3",
    heightCm: "5.1",
    volumeMl: "1650",
    notes: "Standard 8-inch round",
  },
  {
    name: 'Cake Pan Round 9" x 2"',
    shape: "round",
    diameterCm: "22.9",
    heightCm: "5.1",
    volumeMl: "2100",
    notes: "Standard 9-inch round",
  },
  {
    name: 'Cake Pan Round 10" x 2"',
    shape: "round",
    diameterCm: "25.4",
    heightCm: "5.1",
    volumeMl: "2580",
    notes: "Standard 10-inch round",
  },
  {
    name: 'Square Pan 8" x 8" x 2"',
    shape: "square",
    lengthCm: "20.3",
    heightCm: "5.1",
    volumeMl: "2100",
    notes: "Standard 8-inch square",
  },
  {
    name: 'Square Pan 9" x 9" x 2"',
    shape: "square",
    lengthCm: "22.9",
    heightCm: "5.1",
    volumeMl: "2670",
    notes: "Standard 9-inch square",
  },
  {
    name: 'Baking Pan 13" x 9" x 2"',
    shape: "rectangular",
    lengthCm: "33.0",
    widthCm: "22.9",
    heightCm: "5.1",
    volumeMl: "3850",
    notes: "Standard 9x13 pan",
  },
  {
    name: 'Quarter Sheet Pan 13" x 9" x 1"',
    shape: "rectangular",
    lengthCm: "33.0",
    widthCm: "22.9",
    heightCm: "2.5",
    volumeMl: "1880",
    notes: "Quarter sheet",
  },
  {
    name: 'Half Sheet Pan 18" x 13" x 1"',
    shape: "rectangular",
    lengthCm: "45.7",
    widthCm: "33.0",
    heightCm: "2.5",
    volumeMl: "3770",
    notes: "Half sheet",
  },
  {
    name: 'Bundt Pan 10-cup',
    shape: "bundt",
    volumeMl: "2360",
    notes: "Standard 10-cup bundt pan",
  },
  {
    name: 'Muffin Tin 12-cup',
    shape: "custom",
    volumeMl: "1900",
    notes: "Approximate total volume across 12 cups",
  },
];

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

export async function seedDefaultPans() {
  try {
    const existing = await db.query.pans.findMany({
      columns: { name: true },
    });

    const existingNames = new Set(
      existing.map((pan) => pan.name.trim().toLowerCase())
    );

    const toInsert = STANDARD_PANS.filter(
      (pan) => !existingNames.has(pan.name.trim().toLowerCase())
    );

    if (toInsert.length > 0) {
      await db.insert(pans).values(
        toInsert.map((pan) => ({
          name: pan.name,
          shape: pan.shape,
          lengthCm: pan.lengthCm,
          widthCm: pan.widthCm,
          diameterCm: pan.diameterCm,
          heightCm: pan.heightCm,
          volumeMl: pan.volumeMl,
          material: pan.material,
          notes: pan.notes,
        }))
      );
    }

    revalidatePath("/pantry/pans");
    return {
      success: true,
      data: {
        inserted: toInsert.length,
        skipped: STANDARD_PANS.length - toInsert.length,
      },
    };
  } catch (error) {
    console.error("Failed to load standard pans:", error);
    return { success: false, error: "Failed to load standard pans" };
  }
}
