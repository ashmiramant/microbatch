"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { getAvailableRecipesByChannel } from "@/lib/actions/recipes";
import {
  getPublicOrderForEdit,
  updatePublicOrderFromLink,
} from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Recipe = {
  id: number;
  name: string;
  category: string | null;
  imageUrl: string | null;
  description: string | null;
  price: string | null;
  orderFlavorOptions: string[] | null;
};

export default function EditOrderFromLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orderId = Number(id);
  const [token] = useState(() => {
    if (typeof window === "undefined") return "";
    const search = new URLSearchParams(window.location.search);
    return search.get("token") ?? "";
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [flavorSelections, setFlavorSelections] = useState<
    Record<number, Record<string, number>>
  >({});
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!token || !Number.isFinite(orderId)) return;
    async function loadData() {
      setLoading(true);
      setError("");
      const orderResult = await getPublicOrderForEdit(orderId, token);

      if (!orderResult.success || !orderResult.data) {
        setError(orderResult.error ?? "Could not load this order.");
        setLoading(false);
        return;
      }

      const channel =
        orderResult.data.name?.startsWith("[Rooted Community]") ? "rooted_community" : "main";
      const recipesResult = await getAvailableRecipesByChannel(channel);

      if (recipesResult.success && recipesResult.data) {
        setRecipes(
          recipesResult.data.map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category,
            imageUrl: r.imageUrl,
            description: r.description,
            price: r.price,
            orderFlavorOptions: Array.isArray(r.orderFlavorOptions)
              ? r.orderFlavorOptions
                  .map((option) => String(option).trim())
                  .filter(Boolean)
              : null,
          }))
        );
      }

      setCustomerName(orderResult.data.customerName ?? "");
      setCustomerEmail(orderResult.data.customerEmail ?? "");
      setCustomerPhone(orderResult.data.customerPhone ?? "");
      setNotes(orderResult.data.customerNotes ?? "");
      const nextQuantities = orderResult.data.items.reduce<Record<number, number>>(
        (acc, item) => {
          if (item.quantity > 0) acc[item.recipeId] = item.quantity;
          return acc;
        },
        {}
      );
      setQuantities(nextQuantities);

      const nextFlavorSelections = orderResult.data.items.reduce<
        Record<number, Record<string, number>>
      >((acc, item) => {
        const note = item.notes ?? "";
        if (!note.toLowerCase().startsWith("flavors:")) return acc;
        const summary = note.replace(/^flavors:\s*/i, "").trim();
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
      }, {});
      setFlavorSelections(nextFlavorSelections);
      setLoading(false);
    }

    loadData();
  }, [orderId, token]);

  const selectedItems = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([recipeId, qty]) => {
          const recipe = recipes.find((r) => r.id === Number(recipeId));
          const flavorOptions = recipe?.orderFlavorOptions ?? [];
          const flavorCounts = flavorSelections[Number(recipeId)] ?? {};
          const flavorSummary = flavorOptions
            .map((option) => ({ option, count: flavorCounts[option] ?? 0 }))
            .filter((entry) => entry.count > 0)
            .map((entry) => `${entry.option} x${entry.count}`)
            .join(", ");
          return {
            recipeId: Number(recipeId),
            recipeName: recipe?.name ?? "Unknown",
            quantity: qty,
            price: recipe?.price ? parseFloat(recipe.price) : 0,
            flavorOptions,
            flavorCounts,
            flavorSummary,
            notes: flavorSummary ? `Flavors: ${flavorSummary}` : null,
          };
        }),
    [quantities, recipes, flavorSelections]
  );

  const totalPrice = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  function handleQuantityChange(recipeId: number, quantity: string) {
    const qty = parseInt(quantity, 10);
    setQuantities((prev) => {
      const next = { ...prev };
      if (isNaN(qty) || qty <= 0) {
        delete next[recipeId];
      } else {
        next[recipeId] = qty;
      }
      return next;
    });
    setFlavorSelections((prev) => {
      const next = { ...prev };
      if (isNaN(qty) || qty <= 0) {
        delete next[recipeId];
        return next;
      }
      const currentFlavors = next[recipeId];
      if (!currentFlavors) return next;

      const clampedFlavors: Record<string, number> = {};
      let remaining = qty;
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

  function handleFlavorQuantityChange(
    recipeId: number,
    flavor: string,
    quantity: string
  ) {
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError("");

    if (!customerName || !customerEmail || !customerPhone || selectedItems.length === 0) {
      setError("Please fill in all required fields and select at least one item.");
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

    setSaving(true);
    const result = await updatePublicOrderFromLink(orderId, token, {
      customerName,
      customerEmail,
      customerPhone,
      customerNotes: notes,
      items: selectedItems.map((item) => ({
        recipeId: item.recipeId,
        quantity: item.quantity,
        notes: item.notes,
      })),
    });
    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Could not save your changes.");
      return;
    }

    setSaved(true);
  }

  if (!token || !Number.isFinite(orderId)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-text-secondary">This edit link is invalid.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-text-secondary">Loading your order...</p>
      </div>
    );
  }

  if (error && recipes.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-text-secondary">{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/order-form">Back to Order Form</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-serif text-4xl font-semibold text-text-primary">
          Edit Your Order
        </h1>
        <p className="text-text-secondary">
          Update your items and details, then save your changes.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div>
            <h2 className="mb-4 font-serif text-2xl font-semibold text-text-primary">
              Available Items
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {recipes.map((recipe) => (
                <Card key={recipe.id} className="overflow-hidden p-4">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      className="mb-3 h-40 w-full rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="mb-3 flex items-baseline justify-between">
                    <h3 className="font-serif text-lg font-semibold text-text-primary">
                      {recipe.name}
                    </h3>
                    {recipe.price ? (
                      <span className="font-semibold text-accent">
                        ${parseFloat(recipe.price).toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                  {recipe.description ? (
                    <p className="mb-3 text-sm leading-relaxed text-text-secondary">
                      {recipe.description}
                    </p>
                  ) : null}
                          {(recipe.orderFlavorOptions?.length ?? 0) > 0 &&
                          (quantities[recipe.id] ?? 0) > 0 ? (
                            <div className="mb-3 space-y-2 rounded-lg border border-border bg-background p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                Flavor Split
                              </p>
                              {recipe.orderFlavorOptions!.map((flavor) => (
                                (() => {
                                  const selectedQty = quantities[recipe.id] ?? 0;
                                  const currentFlavorQty =
                                    flavorSelections[recipe.id]?.[flavor] ?? 0;
                                  const assignedOtherFlavors =
                                    recipe.orderFlavorOptions!.reduce(
                                      (sum, option) =>
                                        option === flavor
                                          ? sum
                                          : sum +
                                            (flavorSelections[recipe.id]?.[option] ?? 0),
                                      0
                                    );
                                  const maxFlavorQty = Math.max(
                                    0,
                                    selectedQty - assignedOtherFlavors
                                  );

                                  return (
                                <div
                                  key={`${recipe.id}-${flavor}`}
                                  className="flex items-center justify-between gap-2"
                                >
                                  <Label
                                    htmlFor={`edit-flavor-${recipe.id}-${flavor}`}
                                    className="text-sm text-text-primary"
                                  >
                                    {flavor}
                                  </Label>
                                  <Select
                                    value={String(
                                      Math.min(currentFlavorQty, maxFlavorQty)
                                    )}
                                    onValueChange={(value) =>
                                      handleFlavorQuantityChange(
                                        recipe.id,
                                        flavor,
                                        value
                                      )
                                    }
                                  >
                                    <SelectTrigger
                                      id={`edit-flavor-${recipe.id}-${flavor}`}
                                      className="w-24"
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from(
                                        { length: maxFlavorQty + 1 },
                                        (_, i) => i
                                      ).map((value) => (
                                        <SelectItem key={value} value={String(value)}>
                                          {value}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                  );
                                })()
                              ))}
                              <p className="text-xs text-text-secondary">
                                Assigned:{" "}
                                {recipe.orderFlavorOptions!.reduce(
                                  (sum, flavor) =>
                                    sum +
                                    (flavorSelections[recipe.id]?.[flavor] ?? 0),
                                  0
                                )}{" "}
                                / {quantities[recipe.id]}
                              </p>
                            </div>
                          ) : null}
                  <Label htmlFor={`edit-quantity-${recipe.id}`} className="text-sm text-text-secondary">
                    Quantity
                  </Label>
                  <Select
                    value={quantities[recipe.id]?.toString() || "0"}
                    onValueChange={(value) => handleQuantityChange(recipe.id, value)}
                  >
                    <SelectTrigger id={`edit-quantity-${recipe.id}`} className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }).map((_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start">
            <Card className="p-6">
              <h2 className="mb-4 font-serif text-xl font-semibold text-text-primary">
                Your Details
              </h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer-name">Name *</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-email">Email *</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone">Phone *</Label>
                  <Input
                    id="customer-phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <h3 className="mb-3 font-semibold text-text-primary">Order Summary</h3>
                {selectedItems.length === 0 ? (
                  <p className="text-sm text-text-secondary">No items selected yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map((item) => (
                      <div key={item.recipeId} className="flex justify-between text-sm">
                        <div className="text-text-secondary">
                          <span>
                            {item.recipeName} × {item.quantity}
                          </span>
                          {item.flavorSummary ? (
                            <p className="text-xs text-text-secondary">
                              {item.flavorSummary}
                            </p>
                          ) : null}
                        </div>
                        <span className="font-medium text-text-primary">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-border pt-2 font-semibold text-lg">
                      <span className="text-text-primary">Total</span>
                      <span className="text-accent">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
              {saved ? (
                <p className="mt-4 text-sm text-green-700">
                  Your order changes were saved.
                </p>
              ) : null}

              <Button
                type="submit"
                className="mt-6 w-full"
                size="lg"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
