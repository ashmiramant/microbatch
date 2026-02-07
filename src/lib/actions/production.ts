"use server";

import { db } from "@/lib/db";
import {
  productionRuns,
  productionBatches,
  batchTimelineSteps,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────────────────────

type ProductionBatchInput = {
  recipeId: number;
  scalingMode?: "quantity" | "pan" | "multiplier" | null;
  scalingFactor?: string | null;
  targetQuantity?: number | null;
  targetPanId?: number | null;
  notes?: string | null;
};

type CreateProductionRunInput = {
  name: string;
  status?: "draft" | "scheduled" | "in_progress" | "completed" | "cancelled" | null;
  targetCompletionAt?: Date | string | null;
  orderId?: number | null;
  notes?: string | null;
  batches: ProductionBatchInput[];
};

type UpdateProductionRunInput = Partial<Omit<CreateProductionRunInput, "batches">> & {
  batches?: ProductionBatchInput[];
};

type TimelineStepInput = {
  stepType?: string | null;
  name?: string | null;
  description?: string | null;
  scheduledStartAt?: Date | string | null;
  scheduledEndAt?: Date | string | null;
  status?: "upcoming" | "active" | "completed" | "skipped" | null;
  calendarEventId?: string | null;
};

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createProductionRun(data: CreateProductionRunInput) {
  try {
    const result = await db.transaction(async (tx) => {
      const [run] = await tx
        .insert(productionRuns)
        .values({
          name: data.name,
          status: data.status,
          targetCompletionAt: data.targetCompletionAt
            ? new Date(data.targetCompletionAt)
            : null,
          orderId: data.orderId,
          notes: data.notes,
        })
        .returning();

      if (data.batches.length > 0) {
        await tx.insert(productionBatches).values(
          data.batches.map((batch) => ({
            productionRunId: run.id,
            recipeId: batch.recipeId,
            scalingMode: batch.scalingMode,
            scalingFactor: batch.scalingFactor,
            targetQuantity: batch.targetQuantity,
            targetPanId: batch.targetPanId,
            notes: batch.notes,
          }))
        );
      }

      return run;
    });

    revalidatePath("/production");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create production run:", error);
    return { success: false, error: "Failed to create production run" };
  }
}

export async function updateProductionRun(
  id: number,
  data: UpdateProductionRunInput
) {
  try {
    const result = await db.transaction(async (tx) => {
      const { batches, ...runFields } = data;

      const updateValues: Record<string, unknown> = { updatedAt: new Date() };
      if (runFields.name !== undefined) updateValues.name = runFields.name;
      if (runFields.status !== undefined) updateValues.status = runFields.status;
      if (runFields.targetCompletionAt !== undefined) {
        updateValues.targetCompletionAt = runFields.targetCompletionAt
          ? new Date(runFields.targetCompletionAt)
          : null;
      }
      if (runFields.orderId !== undefined) updateValues.orderId = runFields.orderId;
      if (runFields.notes !== undefined) updateValues.notes = runFields.notes;

      const [run] = await tx
        .update(productionRuns)
        .set(updateValues)
        .where(eq(productionRuns.id, id))
        .returning();

      if (batches !== undefined) {
        await tx
          .delete(productionBatches)
          .where(eq(productionBatches.productionRunId, id));

        if (batches.length > 0) {
          await tx.insert(productionBatches).values(
            batches.map((batch) => ({
              productionRunId: id,
              recipeId: batch.recipeId,
              scalingMode: batch.scalingMode,
              scalingFactor: batch.scalingFactor,
              targetQuantity: batch.targetQuantity,
              targetPanId: batch.targetPanId,
              notes: batch.notes,
            }))
          );
        }
      }

      return run;
    });

    revalidatePath("/production");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update production run:", error);
    return { success: false, error: "Failed to update production run" };
  }
}

export async function deleteProductionRun(id: number) {
  try {
    await db.delete(productionRuns).where(eq(productionRuns.id, id));
    revalidatePath("/production");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete production run:", error);
    return { success: false, error: "Failed to delete production run" };
  }
}

export async function getProductionRun(id: number) {
  try {
    const run = await db.query.productionRuns.findFirst({
      where: eq(productionRuns.id, id),
      with: {
        batches: {
          with: {
            recipe: true,
            targetPan: true,
            timelineSteps: true,
          },
        },
        order: true,
      },
    });

    if (!run) {
      return { success: false, error: "Production run not found" };
    }

    return { success: true, data: run };
  } catch (error) {
    console.error("Failed to get production run:", error);
    return { success: false, error: "Failed to get production run" };
  }
}

export async function getProductionRuns() {
  try {
    const allRuns = await db.query.productionRuns.findMany({
      orderBy: [desc(productionRuns.targetCompletionAt)],
      with: {
        batches: true,
        order: true,
      },
    });

    return { success: true, data: allRuns };
  } catch (error) {
    console.error("Failed to get production runs:", error);
    return { success: false, error: "Failed to get production runs" };
  }
}

export async function updateProductionRunStatus(
  id: number,
  status: "draft" | "scheduled" | "in_progress" | "completed" | "cancelled"
) {
  try {
    const [run] = await db
      .update(productionRuns)
      .set({ status, updatedAt: new Date() })
      .where(eq(productionRuns.id, id))
      .returning();

    revalidatePath("/production");
    return { success: true, data: run };
  } catch (error) {
    console.error("Failed to update production run status:", error);
    return { success: false, error: "Failed to update production run status" };
  }
}

export async function updateBatchStatus(
  batchId: number,
  status: "pending" | "in_progress" | "completed"
) {
  try {
    const [batch] = await db
      .update(productionBatches)
      .set({ status, updatedAt: new Date() })
      .where(eq(productionBatches.id, batchId))
      .returning();

    revalidatePath("/production");
    return { success: true, data: batch };
  } catch (error) {
    console.error("Failed to update batch status:", error);
    return { success: false, error: "Failed to update batch status" };
  }
}

export async function createTimelineSteps(
  batchId: number,
  steps: TimelineStepInput[]
) {
  try {
    if (steps.length === 0) {
      return { success: true, data: [] };
    }

    const result = await db
      .insert(batchTimelineSteps)
      .values(
        steps.map((step) => ({
          productionBatchId: batchId,
          stepType: step.stepType,
          name: step.name,
          description: step.description,
          scheduledStartAt: step.scheduledStartAt
            ? new Date(step.scheduledStartAt)
            : null,
          scheduledEndAt: step.scheduledEndAt
            ? new Date(step.scheduledEndAt)
            : null,
          status: step.status,
          calendarEventId: step.calendarEventId,
        }))
      )
      .returning();

    revalidatePath("/production");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create timeline steps:", error);
    return { success: false, error: "Failed to create timeline steps" };
  }
}

export async function updateTimelineStepStatus(
  stepId: number,
  status: "upcoming" | "active" | "completed" | "skipped"
) {
  try {
    const [step] = await db
      .update(batchTimelineSteps)
      .set({ status, updatedAt: new Date() })
      .where(eq(batchTimelineSteps.id, stepId))
      .returning();

    revalidatePath("/production");
    return { success: true, data: step };
  } catch (error) {
    console.error("Failed to update timeline step status:", error);
    return { success: false, error: "Failed to update timeline step status" };
  }
}
