export type OrderVariantDef = { id: string; label: string; price: string };

export function variantLineKey(recipeId: number, variantId: string): string {
  return `${recipeId}:${variantId}`;
}

export function parseOrderVariantsText(text: string): OrderVariantDef[] | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const out: OrderVariantDef[] = [];
  for (const line of lines) {
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
      out.push({ id: parts[0], label: parts[1], price: parts[2] });
    }
  }
  return out.length ? out : null;
}

export function formatOrderVariantsText(variants: unknown): string {
  if (!Array.isArray(variants)) return "";
  return variants
    .map((v: { id?: string; label?: string; price?: string }) => {
      const id = String(v?.id ?? "").trim();
      const label = String(v?.label ?? "").trim();
      const price = String(v?.price ?? "").trim();
      if (!id || !label || !price) return "";
      return `${id}|${label}|${price}`;
    })
    .filter(Boolean)
    .join("\n");
}

export function normalizeOrderVariantsFromDb(raw: unknown): OrderVariantDef[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: OrderVariantDef[] = [];
  for (const v of raw) {
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      const id = String(o.id ?? "").trim();
      const label = String(o.label ?? "").trim();
      const price = String(o.price ?? "").trim();
      if (id && label && price) out.push({ id, label, price });
    }
  }
  return out.length ? out : null;
}
