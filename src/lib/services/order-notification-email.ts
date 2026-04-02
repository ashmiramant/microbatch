import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getVariantLabelFromNotes } from "@/lib/utils/order-item-display";

type SendResult = {
  success: boolean;
  skipped?: boolean;
  reason?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function orderChannelLabel(orderName: string) {
  if (orderName.startsWith("[Rooted Community]")) return "Rooted Community";
  return "Main";
}

function adminOrderUrl(orderId: number): string | null {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return `${explicit.replace(/\/$/, "")}/orders/${orderId}`;
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    return `${host.replace(/\/$/, "")}/orders/${orderId}`;
  }
  return null;
}

function parsePrice(value: string | null | undefined) {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Emails the bakery owner when a new order is created (e.g. public order form).
 * Set ORDER_NOTIFICATION_TO_EMAIL in production (comma-separated for multiple addresses).
 * Uses the same Resend credentials as customer confirmation: RESEND_API_KEY, ORDER_CONFIRMATION_FROM_EMAIL.
 */
export async function sendNewOrderNotificationEmail(
  orderId: number
): Promise<SendResult> {
  const rawTo = process.env.ORDER_NOTIFICATION_TO_EMAIL?.trim();
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_CONFIRMATION_FROM_EMAIL;

  if (!rawTo || !apiKey || !from) {
    return {
      success: false,
      skipped: true,
      reason:
        "Set ORDER_NOTIFICATION_TO_EMAIL (and RESEND_API_KEY / ORDER_CONFIRMATION_FROM_EMAIL) to enable owner notifications.",
    };
  }

  const to = rawTo
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (to.length === 0) {
    return { success: false, skipped: true, reason: "ORDER_NOTIFICATION_TO_EMAIL is empty." };
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: {
        with: { recipe: true },
      },
    },
  });

  if (!order) {
    return { success: false, skipped: true, reason: "Order not found." };
  }

  const notes = order.notes ?? "";
  const lines = notes.split(/\r?\n/);
  let customerName = "";
  let customerEmail = "";
  let customerPhone = "";
  let inNotesSection = false;
  const customerNoteLines: string[] = [];

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
    if (!inNotesSection && line.toLowerCase().startsWith("notes:")) {
      inNotesSection = true;
      customerNoteLines.push(rawLine.replace(/^notes:\s*/i, "").trim());
      continue;
    }
    if (inNotesSection) {
      customerNoteLines.push(rawLine);
    }
  }

  const customerNotesOnly = customerNoteLines.join("\n").trim();
  const channel = orderChannelLabel(order.name);

  const itemLines: string[] = [];
  let total = 0;
  for (const item of order.items) {
    const base = item.recipe?.name ?? `Recipe #${item.recipeId}`;
    const variant = getVariantLabelFromNotes(item.notes);
    const label = variant ? `${base} — ${variant}` : base;
    const unit = parsePrice(item.unitPrice ?? item.recipe?.price ?? null);
    const lineTotal = unit * item.quantity;
    total += lineTotal;
    const pricePart =
      unit > 0 ? ` @ $${unit.toFixed(2)} = $${lineTotal.toFixed(2)}` : "";
    itemLines.push(`- ${item.quantity} × ${label}${pricePart}`);
  }

  const adminUrl = adminOrderUrl(orderId);
  const linkLine = adminUrl ? `\nOpen in MicroBatch:\n${adminUrl}\n` : "";

  const text = `New order received

Order #${orderId}
Channel: ${channel}
Order name: ${order.name}

Customer
--------
Name: ${customerName || "—"}
Email: ${customerEmail || "—"}
Phone: ${customerPhone || "—"}

Items
-----
${itemLines.join("\n")}

Estimated total: $${total.toFixed(2)}

Customer notes
--------------
${customerNotesOnly || "—"}
${linkLine}`;

  const itemsHtml = order.items
    .map((item) => {
      const base = item.recipe?.name ?? `Recipe #${item.recipeId}`;
      const variant = getVariantLabelFromNotes(item.notes);
      const label = variant ? `${base} — ${variant}` : base;
      const unit = parsePrice(item.unitPrice ?? item.recipe?.price ?? null);
      const lineTotal = unit * item.quantity;
      const pricePart =
        unit > 0 ? ` @ $${unit.toFixed(2)} → $${lineTotal.toFixed(2)}` : "";
      return `<li style="margin-bottom:6px;">${escapeHtml(String(item.quantity))} × ${escapeHtml(label)}${escapeHtml(pricePart)}</li>`;
    })
    .join("");

  const linkHtml = adminUrl
    ? `<p style="margin:16px 0 0 0;"><a href="${escapeHtml(adminUrl)}">View order in MicroBatch</a></p>`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <p style="font-size:16px;font-weight:bold;">New order received</p>
      <p><strong>Order #${orderId}</strong> · ${escapeHtml(channel)}</p>
      <p style="color:#6b7280;font-size:14px;">${escapeHtml(order.name)}</p>
      <p style="margin-top:16px;margin-bottom:6px;"><strong>Customer</strong></p>
      <p style="margin:0;">Name: ${escapeHtml(customerName || "—")}<br/>
      Email: ${escapeHtml(customerEmail || "—")}<br/>
      Phone: ${escapeHtml(customerPhone || "—")}</p>
      <p style="margin-top:16px;margin-bottom:6px;"><strong>Items</strong></p>
      <ul style="margin-top:0;padding-left:18px;">${itemsHtml}</ul>
      <p><strong>Estimated total:</strong> $${total.toFixed(2)}</p>
      <p style="margin-top:16px;margin-bottom:6px;"><strong>Customer notes</strong></p>
      <p style="margin:0;white-space:pre-wrap;">${escapeHtml(customerNotesOnly || "—")}</p>
      ${linkHtml}
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `New order #${orderId} — ${customerName || "Customer"}`,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to send owner notification email: ${errorBody}`);
  }

  return { success: true };
}
