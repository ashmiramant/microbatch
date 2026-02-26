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
  channel?: "main" | "rooted_community";
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

type PublicOrderEditInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string | null;
  items: OrderItemInput[];
};

type ParsedOrderDetails = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes: string;
  editToken: string;
  confirmationEmailSentAt: string;
};

function parseOrderDetails(notes: string | null): ParsedOrderDetails {
  const source = notes ?? "";
  const lines = source.split(/\r?\n/);

  let customerName = "";
  let customerEmail = "";
  let customerPhone = "";
  let editToken = "";
  let confirmationEmailSentAt = "";
  let inNotesSection = false;
  const noteLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!inNotesSection && line.toLowerCase().startsWith("customer:")) {
      customerName = line.replace(/^customer:\s*/i, "").trim();
      continue;
    }
    if (!inNotesSection && line.toLowerCase().startsWith("email:")) {
      customerEmail = line.replace(/^email:\s*/i, "").trim();
      continue;
    }
    if (!inNotesSection && line.toLowerCase().startsWith("phone:")) {
      customerPhone = line.replace(/^phone:\s*/i, "").trim();
      continue;
    }
    if (!inNotesSection && line.toLowerCase().startsWith("edit token:")) {
      editToken = line.replace(/^edit token:\s*/i, "").trim();
      continue;
    }
    if (
      !inNotesSection &&
      line.toLowerCase().startsWith("confirmation email sent at:")
    ) {
      confirmationEmailSentAt = line
        .replace(/^confirmation email sent at:\s*/i, "")
        .trim();
      continue;
    }
    if (!inNotesSection && line.toLowerCase().startsWith("notes:")) {
      inNotesSection = true;
      const firstNotesLine = rawLine.replace(/^notes:\s*/i, "");
      noteLines.push(firstNotesLine);
      continue;
    }
    if (inNotesSection) {
      noteLines.push(rawLine);
    }
  }

  return {
    customerName,
    customerEmail,
    customerPhone,
    customerNotes: noteLines.join("\n").trim(),
    editToken,
    confirmationEmailSentAt,
  };
}

function buildOrderNotes(details: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string | null;
  editToken?: string | null;
  confirmationEmailSentAt?: string | null;
}) {
  const notesBody = details.customerNotes?.trim() ? details.customerNotes.trim() : "None";
  const tokenLine = details.editToken ? `\nEdit Token: ${details.editToken}` : "";
  const confirmationLine = details.confirmationEmailSentAt
    ? `\nConfirmation Email Sent At: ${details.confirmationEmailSentAt}`
    : "";
  return `Customer: ${details.customerName}\nEmail: ${details.customerEmail}\nPhone: ${details.customerPhone}${tokenLine}${confirmationLine}\n\nNotes: ${notesBody}`;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createOrder(data: CreateOrderInput) {
  try {
    const result = await db.transaction(async (tx) => {
      const channelPrefix =
        data.channel === "rooted_community" ? "[Rooted Community] " : "";

      const [order] = await tx
        .insert(orders)
        .values({
          name: data.name.startsWith("[")
            ? data.name
            : `${channelPrefix}${data.name}`,
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

    const {
      customerName,
      customerEmail,
      customerNotes,
      confirmationEmailSentAt,
      editToken,
      customerPhone,
    } = parseOrderDetails(
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

    if (!confirmationEmailSentAt) {
      await db
        .update(orders)
        .set({
          notes: buildOrderNotes({
            customerName: customerName || "Customer",
            customerEmail,
            customerPhone: customerPhone || "",
            customerNotes,
            editToken: editToken || null,
            confirmationEmailSentAt: new Date().toISOString(),
          }),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    }
  } catch (error) {
    // Do not block status updates if email fails.
    console.error("Failed to send order confirmation email:", error);
  }
}

export async function getPublicOrderForEdit(id: number, token: string) {
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

    const details = parseOrderDetails(order.notes);
    if (!token || !details.editToken || details.editToken !== token) {
      return { success: false, error: "This edit link is invalid or expired." };
    }

    return {
      success: true,
      data: {
        id: order.id,
        name: order.name,
        status: order.status,
        customerName: details.customerName,
        customerEmail: details.customerEmail,
        customerPhone: details.customerPhone,
        customerNotes: details.customerNotes === "None" ? "" : details.customerNotes,
        items: order.items.map((item) => ({
          recipeId: item.recipeId,
          quantity: item.quantity,
          recipeName: item.recipe?.name ?? `Item #${item.recipeId}`,
          notes: item.notes,
        })),
      },
    };
  } catch (error) {
    console.error("Failed to get public order for edit:", error);
    return { success: false, error: "Failed to load order." };
  }
}

export async function updatePublicOrderFromLink(
  id: number,
  token: string,
  data: PublicOrderEditInput
) {
  try {
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    if (!existingOrder) {
      return { success: false, error: "Order not found" };
    }

    if (existingOrder.status === "archived") {
      return { success: false, error: "Archived orders cannot be edited." };
    }

    const details = parseOrderDetails(existingOrder.notes);
    if (!token || !details.editToken || details.editToken !== token) {
      return { success: false, error: "This edit link is invalid or expired." };
    }

    await db.transaction(async (tx) => {
      const rootedPrefix = existingOrder.name.startsWith("[Rooted Community]")
        ? "[Rooted Community] "
        : "";
      await tx
        .update(orders)
        .set({
          name: `${rootedPrefix}${data.customerName} - ${new Date(
            existingOrder.createdAt ?? new Date()
          ).toLocaleDateString("en-US")}`,
          notes: buildOrderNotes({
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            customerNotes: data.customerNotes,
            editToken: details.editToken,
            confirmationEmailSentAt: details.confirmationEmailSentAt || null,
          }),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id));

      await tx.delete(orderItems).where(eq(orderItems.orderId, id));
      if (data.items.length > 0) {
        await tx.insert(orderItems).values(
          data.items.map((item) => ({
            orderId: id,
            recipeId: item.recipeId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes,
          }))
        );
      }
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    revalidatePath(`/order-form/edit/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update public order:", error);
    return { success: false, error: "Failed to save changes." };
  }
}
