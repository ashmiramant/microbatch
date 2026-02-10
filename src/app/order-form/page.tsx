"use client";

import { useState, useEffect } from "react";
import { getAvailableRecipes } from "@/lib/actions/recipes";
import { createOrder } from "@/lib/actions/orders";
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
};

export default function CustomerOrderFormPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  useEffect(() => {
    async function fetchRecipes() {
      const result = await getAvailableRecipes();
      if (result.success && result.data) {
        setRecipes(
          result.data.map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category,
            imageUrl: r.imageUrl,
            description: r.description,
            price: r.price,
          }))
        );
      }
      setLoading(false);
    }
    fetchRecipes();
  }, []);

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
  };

  const selectedItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const recipe = recipes.find((r) => r.id === Number(id));
      return {
        recipeId: Number(id),
        recipeName: recipe?.name ?? "Unknown",
        quantity: qty,
        price: recipe?.price ? parseFloat(recipe.price) : 0,
      };
    });

  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0 || !customerName || !customerEmail || !customerPhone) {
      alert("Please fill in all required fields and select at least one item.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderNotes = `Customer: ${customerName}\nEmail: ${customerEmail}\nPhone: ${customerPhone}\n\nNotes: ${notes || "None"}`;

      const orderResult = await createOrder({
        name: `${customerName} - ${new Date().toLocaleDateString()}`,
        dueDate: null,
        status: "draft",
        notes: orderNotes,
        items: selectedItems.map((item) => ({
          recipeId: item.recipeId,
          quantity: item.quantity,
        })),
      });

      if (orderResult.success) {
        setOrderSubmitted(true);
        // Reset form
        setQuantities({});
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
          Thank you for your order! You'll hear from me within 24 hours to confirm.
        </p>
        <Button
          onClick={() => setOrderSubmitted(false)}
          size="lg"
        >
          Place Another Order
        </Button>
      </div>
    );
  }

  if (loading) {
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
        <h1 className="mb-2 font-serif text-4xl font-semibold text-text-primary">
          Place Your Order
        </h1>
        <p className="text-xl font-semibold text-accent">
          Saturday February 21st, Pickups 9am or Later!
        </p>
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
                        <span className="text-text-secondary">
                          {item.recipeName} × {item.quantity}
                        </span>
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
                  <li>
                    After submitting this form, you'll hear from me within 24 hours to confirm your order!
                  </li>
                  <li>
                    Pickup is anytime after 9am on Saturdays! Please be in touch if you'll be picking up after dark.
                  </li>
                  <li>
                    Payment is due at pickup cash or Venmo (@AshleyRidley)
                  </li>
                  <li>
                    1006 Kingsway Dr. Apex
                  </li>
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
