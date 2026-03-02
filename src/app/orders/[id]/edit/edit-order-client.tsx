"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrder } from "@/lib/actions/orders";
import { OrderGrid } from "@/components/orders/order-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type Status = "draft" | "confirmed" | "in_production" | "fulfilled" | "cancelled";

type EditOrderClientProps = {
  order: {
    id: number;
    name: string;
    status: string | null;
    notes: string | null;
    items: Array<{
      recipeId: number;
      quantity: number;
      notes?: string | null;
      recipe: {
        name: string;
      } | null;
    }>;
  };
  recipes: Array<{
    id: number;
    name: string;
    category: string | null;
    imageUrl: string | null;
    orderFlavorOptions: string[] | null;
  }>;
};

const statusOptions: Array<{ value: Status; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_production", label: "In Production" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
];

export function EditOrderClient({ order, recipes }: EditOrderClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [orderName, setOrderName] = useState(order.name);
  const [status, setStatus] = useState<Status>((order.status as Status) ?? "draft");
  const [notes, setNotes] = useState(order.notes ?? "");
  const [error, setError] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>(() =>
    order.items.reduce<Record<number, number>>((acc, item) => {
      if (item.quantity > 0) {
        acc[item.recipeId] = item.quantity;
      }
      return acc;
    }, {})
  );
  const [flavorSelections, setFlavorSelections] = useState<
    Record<number, Record<string, number>>
  >(() =>
    order.items.reduce<Record<number, Record<string, number>>>((acc, item) => {
      const summary = getItemSelectionSummary(item.notes);
      if (!summary) return acc;

      const parsed: Record<string, number> = {};
      for (const segment of summary.split(",")) {
        const match = segment.trim().match(/^(.*?)\s+x(\d+)$/i);
        if (!match) continue;
        parsed[match[1].trim()] = parseInt(match[2], 10);
      }

      if (Object.keys(parsed).length > 0) {
        acc[item.recipeId] = parsed;
      }

      return acc;
    }, {})
  );
  const originalItemsByRecipeId = useMemo(
    () =>
      order.items.reduce<Record<number, { quantity: number; notes: string | null }>>(
        (acc, item) => {
          acc[item.recipeId] = {
            quantity: item.quantity,
            notes: item.notes ?? null,
          };
          return acc;
        },
        {}
      ),
    [order.items]
  );

  function getItemSelectionSummary(notes: string | null | undefined) {
    const trimmed = notes?.trim();
    if (!trimmed) return "";
    return trimmed.replace(/^(flavors?|flavor split)\s*:\s*/i, "").trim();
  }

  const selectedItems = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([recipeId, quantity]) => {
          const recipe = recipes.find((r) => r.id === Number(recipeId));
          const originalItem = originalItemsByRecipeId[Number(recipeId)];
          const shouldPreserveNotes =
            !!originalItem && originalItem.quantity === quantity;
          const flavorOptions = recipe?.orderFlavorOptions ?? [];
          const flavorCounts = flavorSelections[Number(recipeId)] ?? {};
          const flavorSummary = flavorOptions
            .map((option) => ({ option, count: flavorCounts[option] ?? 0 }))
            .filter((entry) => entry.count > 0)
            .map((entry) => `${entry.option} x${entry.count}`)
            .join(", ");

          let notesForItem: string | null = null;
          if (flavorOptions.length > 0) {
            notesForItem = flavorSummary
              ? `Flavors: ${flavorSummary}`
              : shouldPreserveNotes
                ? (originalItem?.notes ?? null)
                : null;
          } else {
            notesForItem = shouldPreserveNotes ? (originalItem?.notes ?? null) : null;
          }

          return {
            recipeId: Number(recipeId),
            recipeName: recipe?.name ?? `Recipe #${recipeId}`,
            quantity,
            notes: notesForItem,
            flavorOptions,
            flavorCounts,
            flavorSummary,
          };
        }),
    [quantities, recipes, originalItemsByRecipeId, flavorSelections]
  );

  function handleQuantityChange(recipeId: number, quantity: number) {
    setQuantities((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[recipeId];
      } else {
        next[recipeId] = quantity;
      }
      return next;
    });

    setFlavorSelections((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[recipeId];
        return next;
      }

      const currentFlavors = next[recipeId];
      if (!currentFlavors) return next;

      const clampedFlavors: Record<string, number> = {};
      let remaining = quantity;
      for (const [flavor, count] of Object.entries(currentFlavors)) {
        const clampedCount = Math.max(0, Math.min(count, remaining));
        if (clampedCount > 0) {
          clampedFlavors[flavor] = clampedCount;
          remaining -= clampedCount;
        }
      }

      if (Object.keys(clampedFlavors).length === 0) {
        delete next[recipeId];
      } else {
        next[recipeId] = clampedFlavors;
      }
      return next;
    });
  }

  function handleFlavorQuantityChange(recipeId: number, flavor: string, quantity: string) {
    const qty = parseInt(quantity, 10);
    const recipeQuantity = quantities[recipeId] ?? 0;
    setFlavorSelections((prev) => {
      const next = { ...prev };
      const recipeFlavors = { ...(next[recipeId] ?? {}) };
      const totalOtherFlavors = Object.entries(recipeFlavors).reduce(
        (sum, [selectedFlavor, selectedQty]) =>
          selectedFlavor === flavor ? sum : sum + selectedQty,
        0
      );
      const maxAllowedForFlavor = Math.max(0, recipeQuantity - totalOtherFlavors);

      if (isNaN(qty) || qty <= 0 || maxAllowedForFlavor === 0) {
        delete recipeFlavors[flavor];
      } else {
        recipeFlavors[flavor] = Math.min(qty, maxAllowedForFlavor);
      }

      if (Object.keys(recipeFlavors).length === 0) {
        delete next[recipeId];
      } else {
        next[recipeId] = recipeFlavors;
      }
      return next;
    });
  }

  function handleSave() {
    setError("");
    if (!orderName.trim()) {
      setError("Please add a name for this order.");
      return;
    }

    for (const item of selectedItems) {
      if (item.flavorOptions.length === 0) continue;
      const totalFlavorCount = item.flavorOptions.reduce(
        (sum, option) => sum + (item.flavorCounts[option] ?? 0),
        0
      );
      if (totalFlavorCount !== item.quantity) {
        setError(
          `${item.recipeName}: flavor counts must add up to ${item.quantity}.`
        );
        return;
      }
    }

    startTransition(async () => {
      const result = await updateOrder(order.id, {
        name: orderName.trim(),
        status,
        notes: notes.trim() ? notes.trim() : null,
        items: selectedItems.map((item) => ({
          recipeId: item.recipeId,
          quantity: item.quantity,
          notes: item.notes,
        })),
      });

      if (!result.success) {
        setError(result.error ?? "Could not save this order.");
        return;
      }

      router.push(`/orders/${order.id}`);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order-name">Order Name</Label>
              <Input
                id="order-name"
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
                placeholder="Order name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as Status)}>
                <SelectTrigger id="order-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-notes">Notes</Label>
              <Textarea
                id="order-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add notes for this order (optional)"
              />
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary">
            Update Items
          </h3>
          <OrderGrid
            recipes={recipes}
            quantities={quantities}
            onQuantityChange={handleQuantityChange}
          />
        </div>

        {selectedItems.some((item) => item.flavorOptions.length > 0) ? (
          <Card>
            <CardHeader>
              <CardTitle>Flavor Split</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedItems
                .filter((item) => item.flavorOptions.length > 0)
                .map((item) => (
                  <div
                    key={`flavors-${item.recipeId}`}
                    className="space-y-2 rounded-lg border border-border bg-background p-3"
                  >
                    <p className="text-sm font-semibold text-text-primary">
                      {item.recipeName}
                    </p>
                    {item.flavorOptions.map((flavor) => {
                      const currentFlavorQty = item.flavorCounts[flavor] ?? 0;
                      const assignedOtherFlavors = item.flavorOptions.reduce(
                        (sum, option) =>
                          option === flavor ? sum : sum + (item.flavorCounts[option] ?? 0),
                        0
                      );
                      const maxFlavorQty = Math.max(
                        0,
                        item.quantity - assignedOtherFlavors
                      );

                      return (
                        <div
                          key={`${item.recipeId}-${flavor}`}
                          className="flex items-center justify-between gap-2"
                        >
                          <Label
                            htmlFor={`admin-edit-flavor-${item.recipeId}-${flavor}`}
                            className="text-sm text-text-primary"
                          >
                            {flavor}
                          </Label>
                          <Select
                            value={String(Math.min(currentFlavorQty, maxFlavorQty))}
                            onValueChange={(value) =>
                              handleFlavorQuantityChange(item.recipeId, flavor, value)
                            }
                          >
                            <SelectTrigger
                              id={`admin-edit-flavor-${item.recipeId}-${flavor}`}
                              className="w-24"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: maxFlavorQty + 1 }, (_, i) => i).map(
                                (value) => (
                                  <SelectItem key={value} value={String(value)}>
                                    {value}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                    <p className="text-xs text-text-secondary">
                      Assigned:{" "}
                      {item.flavorOptions.reduce(
                        (sum, flavor) => sum + (item.flavorCounts[flavor] ?? 0),
                        0
                      )}{" "}
                      / {item.quantity}
                    </p>
                  </div>
                ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Selected Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedItems.length > 0 ? (
              <Table>
                <TableBody>
                  {selectedItems.map((item) => (
                    <TableRow key={item.recipeId}>
                      <TableCell className="font-serif">
                        <div>
                          <p>{item.recipeName}</p>
                          {item.flavorSummary ? (
                            <p className="mt-1 text-xs font-normal text-text-secondary">
                              Flavor selection: {item.flavorSummary}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-text-secondary">No items selected.</p>
            )}

            {error ? <p className="text-sm text-error">{error}</p> : null}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/orders/${order.id}`)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                className="w-full"
                onClick={handleSave}
                disabled={isPending || !orderName.trim()}
              >
                {isPending ? "Saving..." : "Save Order"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
