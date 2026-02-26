"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAvailableRecipesByChannel } from "@/lib/actions/recipes";
import { createOrder } from "@/lib/actions/orders";
import {
  getOrderFormAvailability,
  getRootedOrderFormAvailability,
} from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Check } from "lucide-react";

type Recipe = {
  id: number;
  name: string;
  category: string | null;
  imageUrl: string | null;
  description: string | null;
  price: string | null;
  orderFlavorOptions: string[] | null;
};

type PublicOrderFormProps = {
  channel?: "main" | "rooted_community";
  title: string;
  headerLines: string[];
};

export function PublicOrderForm({
  channel = "main",
  title,
  headerLines,
}: PublicOrderFormProps) {
  const [orderFormOpen, setOrderFormOpen] = useState<boolean | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [flavorSelections, setFlavorSelections] = useState<
    Record<number, Record<string, number>>
  >({});
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [submittedTotal, setSubmittedTotal] = useState(0);
  const [submittedOrderId, setSubmittedOrderId] = useState<number | null>(null);
  const [submittedEditToken, setSubmittedEditToken] = useState("");

  useEffect(() => {
    async function fetchRecipes() {
      const settingResult =
        channel === "rooted_community"
          ? await getRootedOrderFormAvailability()
          : await getOrderFormAvailability();
      const isOpen = settingResult.data ?? false;
      setOrderFormOpen(isOpen);

      if (!isOpen) {
        setLoading(false);
        return;
      }

      const result = await getAvailableRecipesByChannel(channel);
      if (result.success && result.data) {
        setRecipes(
          result.data.map((r) => ({
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
      setLoading(false);
    }
    fetchRecipes();
  }, [channel]);

  const handleQuantityChange = (recipeId: number, quantity: string) => {
    const qty = parseInt(quantity);
    setQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0 || isNaN(qty)) {
        delete next[recipeId];
      } else {
        next[recipeId] = qty;
      }
      return next;
    });
    setFlavorSelections((prev) => {
      const next = { ...prev };
      if (qty <= 0 || isNaN(qty)) {
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
  };

  const handleFlavorQuantityChange = (
    recipeId: number,
    flavor: string,
    quantity: string
  ) => {
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
  };

  const selectedItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const recipe = recipes.find((r) => r.id === Number(id));
      const flavorOptions = recipe?.orderFlavorOptions ?? [];
      const flavorCounts = flavorSelections[Number(id)] ?? {};
      const flavorSummary = flavorOptions
        .map((option) => ({ option, count: flavorCounts[option] ?? 0 }))
        .filter((entry) => entry.count > 0)
        .map((entry) => `${entry.option} x${entry.count}`)
        .join(", ");
      return {
        recipeId: Number(id),
        recipeName: recipe?.name ?? "Unknown",
        quantity: qty,
        price: recipe?.price ? parseFloat(recipe.price) : 0,
        flavorOptions,
        flavorCounts,
        flavorSummary,
        notes: flavorSummary ? `Flavors: ${flavorSummary}` : null,
      };
    });

  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const reminders =
    channel === "rooted_community"
      ? [
          "After submitting this form, you'll hear from me within 24 hours to confirm your order!",
          "Pickup is 4:30pm - 5:30 ever other Tuesday!",
          "Payment is due at pickup cash or Venmo (@AshleyRidley)",
        ]
      : [
          "After submitting this form, you'll hear from me within 24 hours to confirm your order!",
          "Pickup is anytime after 9am on Saturdays! Please be in touch if you'll be picking up after dark.",
          "Payment is due at pickup cash or Venmo (@AshleyRidley)",
          "1006 Kingsway Dr. Apex",
        ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0 || !customerName || !customerEmail || !customerPhone) {
      alert("Please fill in all required fields and select at least one item.");
      return;
    }

    for (const item of selectedItems) {
      if (item.flavorOptions.length === 0) continue;
      const totalFlavorCount = item.flavorOptions.reduce(
        (sum, option) => sum + (item.flavorCounts[option] ?? 0),
        0
      );
      if (totalFlavorCount !== item.quantity) {
        alert(
          `${item.recipeName}: please assign flavors so the total matches quantity (${item.quantity}).`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const editToken = crypto.randomUUID();
      const orderNotes = `Customer: ${customerName}\nEmail: ${customerEmail}\nPhone: ${customerPhone}\nEdit Token: ${editToken}\n\nNotes: ${notes || "None"}`;

      const orderResult = await createOrder({
        name: `${customerName} - ${new Date().toLocaleDateString()}`,
        channel,
        dueDate: null,
        status: "draft",
        notes: orderNotes,
        items: selectedItems.map((item) => ({
          recipeId: item.recipeId,
          quantity: item.quantity,
          notes: item.notes,
        })),
      });

      if (orderResult.success) {
        setSubmittedTotal(totalPrice);
        setSubmittedOrderId(orderResult.data?.id ?? null);
        setSubmittedEditToken(editToken);
        setOrderSubmitted(true);
        // Reset form
        setQuantities({});
        setFlavorSelections({});
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setNotes("");
      }
    } catch (error) {
      console.error("Failed to create order:", error);
      alert("Sorry, there was an error submitting your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSubmitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <Check className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <h1 className="mb-4 font-serif text-3xl font-semibold text-text-primary">
          Order Received!
        </h1>
        <p className="mb-8 text-lg text-text-secondary">
          Thank you for your order! You&apos;ll hear from me within 24 hours to confirm.
        </p>
        <div className="mb-8 rounded-lg border border-border bg-surface p-4 text-left">
          <p className="text-base font-semibold text-text-primary">
            Order Total: ${submittedTotal.toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            Payment due upon pickup, cash or venmo.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {submittedOrderId ? (
            <Button asChild variant="outline" size="lg">
              <Link
                href={`/order-form/edit/${submittedOrderId}?token=${encodeURIComponent(submittedEditToken)}`}
              >
                Edit Order
              </Link>
            </Button>
          ) : null}
          <Button
            onClick={() => {
              setOrderSubmitted(false);
              setSubmittedOrderId(null);
              setSubmittedTotal(0);
              setSubmittedEditToken("");
            }}
            size="lg"
          >
            Place Another Order
          </Button>
        </div>
      </div>
    );
  }

  if (orderFormOpen === false) {
    return (
      <div className="mx-auto flex min-h-[75vh] w-full max-w-3xl items-center px-4 py-10">
        <Card className="w-full border-border bg-surface p-8 text-center shadow-sm">
          <img
            src="https://res.cloudinary.com/da6u3wxr8/image/upload/v1771440625/BRB-_Logo_1_gdigbm.png"
            alt="BRB Logo"
            className="mx-auto mb-6 h-auto w-full max-w-[180px]"
          />
          <p className="mb-3 inline-block rounded-full bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Weekly Update
          </p>
          <h1 className="mb-3 font-serif text-4xl font-semibold text-text-primary">
            Orders Are Closed This Week
          </h1>
          <p className="mx-auto mb-6 max-w-xl text-base leading-relaxed text-text-secondary">
            Thank you so much for your support. Online ordering is temporarily closed for the week.
          </p>
          <div className="mx-auto max-w-xl rounded-xl border border-border bg-background p-4">
            <p className="text-lg font-semibold text-accent">
              The bake stand will be open Saturday at 9:00 AM!
            </p>
          </div>
          <p className="mt-6 text-sm text-text-secondary">
            Please check back soon when next week&apos;s order form reopens.
          </p>
        </Card>
      </div>
    );
  }

  if (loading || orderFormOpen === null) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-semibold text-text-primary">
            Loading...
          </h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-lg border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 text-center">
        <img
          src="https://res.cloudinary.com/da6u3wxr8/image/upload/v1771440625/BRB-_Logo_1_gdigbm.png"
          alt="BRB Logo"
          className="mx-auto mb-6 h-auto w-full max-w-[220px]"
        />
        <h1 className="mb-2 font-serif text-4xl font-semibold text-text-primary">
          {title}
        </h1>
        <div className="space-y-1">
          {headerLines.map((line) => (
            <p key={line} className="text-xl font-semibold text-accent">
              {line}
            </p>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Products Grid */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-semibold text-text-primary">
              Available Items
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {recipes.map((recipe) => (
                <Card key={recipe.id} className="overflow-hidden p-4">
                  {recipe.imageUrl && (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      className="mb-3 h-40 w-full rounded-lg object-cover"
                    />
                  )}
                  <div className="mb-3 flex items-baseline justify-between">
                    <h3 className="font-serif text-lg font-semibold text-text-primary">
                      {recipe.name}
                    </h3>
                    {recipe.price && (
                      <span className="font-semibold text-accent">
                        ${parseFloat(recipe.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {recipe.description ? (
                    <p className="mb-3 text-sm leading-relaxed text-text-secondary">
                      {recipe.description}
                    </p>
                  ) : null}
                  <div>
                    <Label htmlFor={`quantity-${recipe.id}`} className="text-sm text-text-secondary">
                      Quantity
                    </Label>
                    <Select
                      value={quantities[recipe.id]?.toString() || "0"}
                      onValueChange={(value) => handleQuantityChange(recipe.id, value)}
                    >
                      <SelectTrigger id={`quantity-${recipe.id}`} className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="7">7</SelectItem>
                        <SelectItem value="8">8</SelectItem>
                        <SelectItem value="9">9</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(recipe.orderFlavorOptions?.length ?? 0) > 0 &&
                  (quantities[recipe.id] ?? 0) > 0 ? (
                    <div className="mt-3 space-y-2 rounded-lg border border-border bg-background p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Flavor Split
                      </p>
                      <div className="space-y-2">
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
                                    : sum + (flavorSelections[recipe.id]?.[option] ?? 0),
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
                              htmlFor={`flavor-${recipe.id}-${flavor}`}
                              className="text-sm text-text-primary"
                            >
                              {flavor}
                            </Label>
                            <Select
                              value={
                                String(
                                  Math.min(currentFlavorQty, maxFlavorQty)
                                )
                              }
                              onValueChange={(value) =>
                                handleFlavorQuantityChange(recipe.id, flavor, value)
                              }
                            >
                              <SelectTrigger
                                id={`flavor-${recipe.id}-${flavor}`}
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
                      </div>
                      <p className="text-xs text-text-secondary">
                        Assigned:{" "}
                        {recipe.orderFlavorOptions!.reduce(
                          (sum, flavor) =>
                            sum + (flavorSelections[recipe.id]?.[flavor] ?? 0),
                          0
                        )}{" "}
                        / {quantities[recipe.id]}
                      </p>
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          </div>

          {/* Order Summary & Customer Info */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Card className="p-6">
              <div className="mb-6 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-text-secondary" />
                <h2 className="font-serif text-xl font-semibold text-text-primary">
                  Your Order
                </h2>
              </div>

              {/* Customer Information */}
              <div className="mb-6 space-y-4">
                <div>
                  <Label htmlFor="customer-name" className="text-text-primary">
                    Name (First and Last) *
                  </Label>
                  <Input
                    id="customer-name"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="customer-phone" className="text-text-primary">
                    Phone *
                  </Label>
                  <Input
                    id="customer-phone"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="customer-email" className="text-text-primary">
                    Email *
                  </Label>
                  <Input
                    id="customer-email"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-text-primary">
                    Notes
                  </Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="mb-6 border-t border-border pt-4">
                <h3 className="mb-3 font-semibold text-text-primary">
                  Order Summary
                </h3>
                {selectedItems.length === 0 ? (
                  <p className="text-sm text-text-secondary">
                    No items selected yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map((item) => (
                      <div
                        key={item.recipeId}
                        className="flex justify-between text-sm"
                      >
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
                    <div className="space-y-1 border-t border-border pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Total Items</span>
                        <span className="text-text-primary">{totalItems}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg">
                        <span className="text-text-primary">Total</span>
                        <span className="text-accent">${totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reminders */}
              <div className="mb-6 rounded-lg bg-background p-4 text-sm">
                <h3 className="mb-2 font-semibold text-text-primary">
                  Reminders:
                </h3>
                <ul className="space-y-2 text-text-secondary">
                  {reminders.map((reminder) => (
                    <li key={reminder}>{reminder}</li>
                  ))}
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || selectedItems.length === 0}
              >
                {isSubmitting ? "Submitting..." : "Submit Order"}
              </Button>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CustomerOrderFormPage() {
  return (
    <PublicOrderForm
      channel="main"
      title="Place Your Order"
      headerLines={["Saturday, February 21st: Pickup 9am or Later"]}
    />
  );
}
