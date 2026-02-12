type ConfirmationEmailInput = {
  to: string;
  customerName: string;
  orderName: string;
  items: Array<{ name: string; quantity: number }>;
  notes?: string | null;
};

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

function buildEmailText(input: ConfirmationEmailInput) {
  const itemsText = input.items.map((item) => `- ${item.name} x${item.quantity}`).join("\n");
  const notesText = input.notes?.trim() ? `\n\nNotes:\n${input.notes.trim()}` : "";

  return `Hi ${input.customerName},

Thanks for your order, consider it confirmed!
Pickups begin at 9am or later!
1006 Kingsway Drive, Apex

Order: ${input.orderName}

Items:
${itemsText}${notesText}

See you Saturday!

Ashley`;
}

function buildEmailHtml(input: ConfirmationEmailInput) {
  const itemsHtml = input.items
    .map(
      (item) =>
        `<li style="margin-bottom:6px;">${escapeHtml(item.name)} x${item.quantity}</li>`
    )
    .join("");

  const notesHtml = input.notes?.trim()
    ? `<p style="margin:16px 0 0 0;"><strong>Notes:</strong><br/>${escapeHtml(input.notes.trim())}</p>`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <p>Hi ${escapeHtml(input.customerName)},</p>
      <p>Thanks for your order, consider it confirmed!</p>
      <p>
        Pickups begin at 9am or later!<br/>
        1006 Kingsway Drive, Apex
      </p>
      <p><strong>Order:</strong> ${escapeHtml(input.orderName)}</p>
      <p style="margin-bottom:6px;"><strong>Items:</strong></p>
      <ul style="margin-top:0; padding-left:18px;">
        ${itemsHtml}
      </ul>
      ${notesHtml}
      <p style="margin-top:20px;">See you Saturday!</p>
      <p style="margin-top:12px;">Ashley</p>
    </div>
  `;
}

export async function sendOrderConfirmationEmail(
  input: ConfirmationEmailInput
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_CONFIRMATION_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      success: false,
      skipped: true,
      reason: "Missing RESEND_API_KEY or ORDER_CONFIRMATION_FROM_EMAIL",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Order Confirmed: ${input.orderName}`,
      html: buildEmailHtml(input),
      text: buildEmailText(input),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to send confirmation email: ${errorBody}`);
  }

  return { success: true };
}
