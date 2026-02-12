import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/actions/orders";
import { getRecipes } from "@/lib/actions/recipes";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EditOrderClient } from "./edit-order-client";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const orderId = Number(id);

  if (!Number.isFinite(orderId)) {
    notFound();
  }

  const [orderResult, recipesResult] = await Promise.all([
    getOrder(orderId),
    getRecipes(),
  ]);

  if (!orderResult.success || !orderResult.data) {
    notFound();
  }

  const recipes =
    recipesResult.success && recipesResult.data
      ? recipesResult.data.map((recipe) => ({
          id: recipe.id,
          name: recipe.name,
          category: recipe.category,
          imageUrl: recipe.imageUrl,
        }))
      : [];

  return (
    <div>
      <PageHeader
        title={`Edit ${orderResult.data.name}`}
        description="Update order details and selected items."
        action={
          <Button asChild variant="outline">
            <Link href={`/orders/${orderId}`}>Back to Order</Link>
          </Button>
        }
      />

      <EditOrderClient order={orderResult.data} recipes={recipes} />
    </div>
  );
}
