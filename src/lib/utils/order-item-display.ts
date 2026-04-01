/**
 * Order item notes may include `Variant: Label` from multi-price product variants.
 */
export function getVariantLabelFromNotes(notes: string | null | undefined): string | null {
  if (!notes?.trim()) return null;
  const m = notes.trim().match(/^Variant:\s*(.+)$/im);
  return m?.[1]?.trim() ?? null;
}

/** Flavor split lines use `Flavors: ...` / `Flavor split: ...` — not used when the line is a variant. */
export function getFlavorSelectionSummaryFromNotes(
  notes: string | null | undefined
): string {
  const trimmed = notes?.trim();
  if (!trimmed) return "";
  if (/^Variant:\s*/im.test(trimmed)) return "";
  return trimmed.replace(/^(flavors?|flavor split)\s*:\s*/i, "").trim();
}
