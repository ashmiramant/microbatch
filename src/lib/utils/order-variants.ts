export type OrderVariantDef = { id: string; label: string; price: string };

export function variantLineKey(recipeId: number, variantId: string): string {
  return `${recipeId}:${variantId}`;
}

/** Parse a single variant line: `id|label|price` or `id, label, price` (label may contain commas). */
export function parseOrderVariantLine(line: string): OrderVariantDef | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (trimmed.includes("|")) {
    const parts = trimmed.split("|").map((p) => p.trim());
    if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
      return { id: parts[0], label: parts[1], price: parts[2] };
    }
    return null;
  }

  const commaParts = trimmed.split(",").map((p) => p.trim());
  if (commaParts.length >= 3) {
    const id = commaParts[0];
    const price = commaParts[commaParts.length - 1]!;
    const label = commaParts.slice(1, -1).join(", ").trim();
    if (id && label && price) {
      return { id, label, price };
    }
  }

  return null;
}

function parseOrderVariantsFromJsonText(text: string): OrderVariantDef[] | null {
  const t = text.trim();
  if (!t.startsWith("[")) return null;
  try {
    const parsed: unknown = JSON.parse(t);
    return normalizeOrderVariantsFromDb(parsed);
  } catch {
    return null;
  }
}

export function parseOrderVariantsText(text: string): OrderVariantDef[] | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fromJson = parseOrderVariantsFromJsonText(trimmed);
  if (fromJson && fromJson.length > 0) return fromJson;

  const lines = trimmed
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const out: OrderVariantDef[] = [];
  for (const line of lines) {
    const row = parseOrderVariantLine(line);
    if (row) out.push(row);
  }
  return out.length ? out : null;
}

function coerceVariantsArray(raw: unknown): unknown[] | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;
    try {
      const parsed: unknown = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return Array.isArray(raw) ? raw : null;
}

export function formatOrderVariantsText(variants: unknown): string {
  const arr = coerceVariantsArray(variants);
  if (!arr || arr.length === 0) return "";
  return arr
    .map((entry) => {
      const v = entry as { id?: string; label?: string; price?: string | number };
      const id = String(v?.id ?? "").trim();
      const label = String(v?.label ?? "").trim();
      const price =
        v?.price != null && v.price !== ""
          ? String(v.price).trim()
          : "";
      if (!id || !label || !price) return "";
      return `${id}|${label}|${price}`;
    })
    .filter(Boolean)
    .join("\n");
}

export function normalizeOrderVariantsFromDb(raw: unknown): OrderVariantDef[] | null {
  const arr = coerceVariantsArray(raw);
  if (!arr || arr.length === 0) return null;
  const out: OrderVariantDef[] = [];
  for (const v of arr) {
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      const id = String(o.id ?? "").trim();
      const label = String(o.label ?? "").trim();
      const priceRaw = o.price;
      const price =
        priceRaw != null && priceRaw !== ""
          ? String(priceRaw).trim()
          : "";
      if (id && label && price) out.push({ id, label, price });
    }
  }
  return out.length ? out : null;
}
