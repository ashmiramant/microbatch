/**
 * Packaging needs calculator.
 *
 * Determines how many of each packaging type are required across all batches,
 * compares with current stock, and flags shortfalls and low-stock items.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PackagingNeed {
  packagingTypeId: number;
  name: string;
  /** Total units required across all batches. */
  quantityNeeded: number;
  /** Current inventory stock. */
  currentStock: number;
  /** How many units are short (0 if stock is sufficient). */
  shortfall: number;
  /** True if currentStock minus quantityNeeded falls below the reorder threshold. */
  isLowStock: boolean;
}

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Calculate packaging requirements from a set of production batches.
 *
 * For each batch, the `targetQuantity` is the number of finished items.
 * Each packaging entry defines how many of that packaging type are consumed
 * per finished item (`quantityPerYield`).
 *
 * Items with the same `packagingTypeId` are aggregated across batches.
 *
 * @param batches - Array of batch objects with target quantities and packaging specs.
 * @returns An array of packaging needs, sorted by name.
 */
export function calculatePackagingNeeds(
  batches: Array<{
    targetQuantity: number;
    packaging: Array<{
      packagingTypeId: number;
      name: string;
      quantityPerYield: number;
      currentStock: number;
      reorderThreshold: number;
    }>;
  }>,
): PackagingNeed[] {
  const needsMap = new Map<
    number,
    {
      packagingTypeId: number;
      name: string;
      quantityNeeded: number;
      currentStock: number;
      reorderThreshold: number;
    }
  >();

  for (const batch of batches) {
    for (const pkg of batch.packaging) {
      const required = Math.ceil(batch.targetQuantity * pkg.quantityPerYield);
      const existing = needsMap.get(pkg.packagingTypeId);

      if (existing) {
        existing.quantityNeeded += required;
        // Use the latest stock and threshold (they should be consistent
        // across batches for the same packagingTypeId, but we take the
        // last-seen value as a safe default).
        existing.currentStock = pkg.currentStock;
        existing.reorderThreshold = pkg.reorderThreshold;
      } else {
        needsMap.set(pkg.packagingTypeId, {
          packagingTypeId: pkg.packagingTypeId,
          name: pkg.name,
          quantityNeeded: required,
          currentStock: pkg.currentStock,
          reorderThreshold: pkg.reorderThreshold,
        });
      }
    }
  }

  const results: PackagingNeed[] = [];
  for (const entry of needsMap.values()) {
    const shortfall = Math.max(0, entry.quantityNeeded - entry.currentStock);
    const remainingAfterUse = entry.currentStock - entry.quantityNeeded;
    const isLowStock = remainingAfterUse < entry.reorderThreshold;

    results.push({
      packagingTypeId: entry.packagingTypeId,
      name: entry.name,
      quantityNeeded: entry.quantityNeeded,
      currentStock: entry.currentStock,
      shortfall,
      isLowStock,
    });
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}
