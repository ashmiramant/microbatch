"use server";

import { db } from "@/lib/db";
import { orders, orderItems, recipes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendOrderConfirmationEmail } from "@/lib/services/order-confirmation-email";

// ─── Types ───────────────────────────────────────────────────────────────────

type OrderItemInput = {
  recipeId: number;
  quantity: number;
  unitPrice?: string | null;
  notes?: string | null;
};

type CreateOrderInput = {
  name: string;
  dueDate?: Date | string | null;
  status?:
    | "draft"
    | "confirmed"
    | "in_production"
    | "fulfilled"
    | "cancelled"
    | "archived"
    | null;
  notes?: string | null;
  items: OrderItemInput[];
};

type UpdateOrderInput = Partial<Omit<CreateOrderInput, "items">> & {
  items?: OrderItemInput[];
};

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createOrder(data: CreateOrderInput) {
  try {
    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          name: data.name,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          status: data.status,
          notes: data.notes,
        })
        .returning();

      if (data.items.length > 0) {
        await tx.insert(orderItems).values(
          data.items.map((item) => ({
            orderId: order.id,
            recipeId: item.recipeId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes,
          }))
        );
      }

      return order;
    });

    revalidatePath("/orders");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create order:", error);
    return { success: false, error: "Failed to create order" };
  }
}

export async function updateOrder(id: number, data: UpdateOrderInput) {
  try {
    const result = await db.transaction(async (tx) => {
      const { items, ...orderFields } = data;

      const updateValues: Record<string, unknown> = { updatedAt: new Date() };
      if (orderFields.name !== undefined) updateValues.name = orderFields.name;
      if (orderFields.dueDate !== undefined) {
        updateValues.dueDate = orderFields.dueDate
          ? new Date(orderFields.dueDate)
          : null;
      }
      if (orderFields.status !== undefined) updateValues.status = orderFields.status;
      if (orderFields.notes !== undefined) updateValues.notes = orderFields.notes;

      const [order] = await tx
        .update(orders)
        .set(updateValues)
        .where(eq(orders.id, id))
        .returning();

      if (items !== undefined) {
        await tx.delete(orderItems).where(eq(orderItems.orderId, id));

        if (items.length > 0) {
          await tx.insert(orderItems).values(
            items.map((item) => ({
              orderId: id,
              recipeId: item.recipeId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              notes: item.notes,
            }))
          );
        }
      }

      return order;
    });

    revalidatePath("/orders");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update order:", error);
    return { success: false, error: "Failed to update order" };
  }
}

export async function deleteOrder(id: number) {
  try {
    await db.delete(orders).where(eq(orders.id, id));
    revalidatePath("/orders");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete order:", error);
    return { success: false, error: "Failed to delete order" };
  }
}

export async function getOrder(id: number) {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: {
          with: {
            recipe: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    return { success: true, data: order };
  } catch (error) {
    console.error("Failed to get order:", error);
    return { success: false, error: "Failed to get order" };
  }
}

export async function getOrders() {
  try {
    const allOrders = await db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
      with: {
        items: {
          with: {
            recipe: true,
          },
        },
      },
    });

    return { success: true, data: allOrders };
  } catch (error) {
    console.error("Failed to get orders:", error);
    return { success: false, error: "Failed to get orders" };
  }
}

export async function updateOrderStatus(
  id: number,
  status:
    | "draft"
    | "confirmed"
    | "in_production"
    | "fulfilled"
    | "cancelled"
    | "archived"
) {
  try {
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    const shouldSendConfirmation =
      status === "confirmed" && existingOrder?.status === "draft";

    if (shouldSendConfirmation) {
      await sendConfirmationEmailForOrder(id);
    }

    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    return { success: true, data: order };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

export async function archiveOrder(id: number) {
  return updateOrderStatus(id, "archived");
}

export async function unarchiveOrder(id: number) {
  return updateOrderStatus(id, "confirmed");
}

function extractCustomerDetails(notes: string | null) {
  const source = notes ?? "";
  const nameMatch = source.match(/^Customer:\s*(.+)$/im);
  const emailMatch = source.match(/^Email:\s*(.+)$/im);
  const notesMatch = source.match(/^Notes:\s*([\s\S]*)$/im);

  return {
    customerName: (nameMatch?.[1] ?? "").trim(),
    customerEmail: (emailMatch?.[1] ?? "").trim(),
    customerNotes: (notesMatch?.[1] ?? "").trim(),
  };
}

async function sendConfirmationEmailForOrder(orderId: number) {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: {
          with: {
            recipe: true,
          },
        },
      },
    });

    if (!order) return;

    const { customerName, customerEmail, customerNotes } = extractCustomerDetails(
      order.notes
    );

    if (!customerEmail) return;

    await sendOrderConfirmationEmail({
      to: customerEmail,
      customerName: customerName || "there",
      orderName: order.name,
      items: order.items.map((item) => ({
        name: item.recipe?.name ?? `Item #${item.recipeId}`,
        quantity: item.quantity,
      })),
      notes: customerNotes || null,
    });
  } catch (error) {
    // Do not block status updates if email fails.
    console.error("Failed to send order confirmation email:", error);
  }
}
