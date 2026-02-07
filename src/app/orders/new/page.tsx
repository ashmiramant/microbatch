"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getRecipes } from "@/lib/actions/recipes";
import { createOrder } from "@/lib/actions/orders";
import { createProductionRun } from "@/lib/actions/production";
import { PageHeader } from "@/components/layout/page-header";
import { OrderGrid } from "@/components/orders/order-grid";
import { OrderSummary } from "@/components/orders/order-summary";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Recipe = {
  id: number;
  name: string;
  category: string | null;
  imageUrl: string | null;
};

export default function NewOrderPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [orderName, setOrderName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchRecipes() {
      const result = await getRecipes();
      if (result.success && result.data) {
        setRecipes(
          result.data.map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category,
            imageUrl: r.imageUrl,
          }))
        );
      }
      setLoading(false);
    }
    fetchRecipes();
  }, []);

  const handleQuantityChange = useCallback(
    (recipeId: number, quantity: number) => {
      setQuantities((prev) => {
        const next = { ...prev };
        if (quantity <= 0) {
          delete next[recipeId];
        } else {
          next[recipeId] = quantity;
        }
        return next;
      });
    },
    []
  );

  const selectedItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const recipe = recipes.find((r) => r.id === Number(id));
      return {
        recipeId: Number(id),
        recipeName: recipe?.name ?? "Unknown",
        quantity: qty,
      };
    });

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return;

    setIsSubmitting(true);
    try {
      const name =
        orderName.trim() ||
        `Order ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

      const orderResult = await createOrder({
        name,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        status: "confirmed",
        items: selectedItems.map((item) => ({
          recipeId: item.recipeId,
          quantity: item.quantity,
        })),
      });

      if (orderResult.success && orderResult.data) {
        // Also create a production run from the order
        await createProductionRun({
          name: `Production: ${name}`,
          status: "draft",
          targetCompletionAt: dueDate
            ? new Date(dueDate).toISOString()
            : null,
          orderId: orderResult.data.id,
          batches: selectedItems.map((item) => ({
            recipeId: item.recipeId,
            scalingMode: "quantity" as const,
            targetQuantity: item.quantity,
          })),
        });

        router.push(`/orders/${orderResult.data.id}`);
      }
    } catch (error) {
      console.error("Failed to create order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="New Order" description="Loading recipes..." />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="New Order"
        description="Select recipes and quantities for your bake day."
      />

      <div className="mb-6">
        <Label htmlFor="order-name">Order Name</Label>
        <Input
          id="order-name"
          placeholder={`e.g. "Saturday Market" or "Cafe Delivery"`}
          value={orderName}
          onChange={(e) => setOrderName(e.target.value)}
          className="mt-1.5 max-w-md"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <OrderGrid
          recipes={recipes}
          quantities={quantities}
          onQuantityChange={handleQuantityChange}
        />

        <div className="lg:sticky lg:top-8 lg:self-start">
          <OrderSummary
            items={selectedItems}
            dueDate={dueDate}
            onDueDateChange={setDueDate}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
