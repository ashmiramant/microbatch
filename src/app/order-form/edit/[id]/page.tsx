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
};

export default function EditOrderFromLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orderId = Number(id);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setToken(search.get("token") ?? "");
  }, []);

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
          }))
        );
      }

      setCustomerName(orderResult.data.customerName ?? "");
      setCustomerEmail(orderResult.data.customerEmail ?? "");
      setCustomerPhone(orderResult.data.customerPhone ?? "");
      setNotes(orderResult.data.customerNotes ?? "");
      setQuantities(
        orderResult.data.items.reduce<Record<number, number>>((acc, item) => {
          if (item.quantity > 0) acc[item.recipeId] = item.quantity;
          return acc;
        }, {})
      );
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
          return {
            recipeId: Number(recipeId),
            recipeName: recipe?.name ?? "Unknown",
            quantity: qty,
            price: recipe?.price ? parseFloat(recipe.price) : 0,
          };
        }),
    [quantities, recipes]
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
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError("");

    if (!customerName || !customerEmail || !customerPhone || selectedItems.length === 0) {
      setError("Please fill in all required fields and select at least one item.");
      return;
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
                        <span className="text-text-secondary">
                          {item.recipeName} × {item.quantity}
                        </span>
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
