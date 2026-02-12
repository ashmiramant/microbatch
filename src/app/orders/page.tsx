import Link from "next/link";
import { getOrders } from "@/lib/actions/orders";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireAuth } from "@/lib/auth";
import { OrdersListClient } from "@/components/orders/orders-list-client";

export default async function OrdersPage() {
  await requireAuth();
  const result = await getOrders();
  const orders = result.success ? result.data ?? [] : [];
  const itemTotals = orders.reduce<Record<string, number>>((acc, order) => {
    for (const item of order.items ?? []) {
      const recipeName = item.recipe?.name ?? `Recipe #${item.recipeId}`;
      acc[recipeName] = (acc[recipeName] ?? 0) + item.quantity;
    }
    return acc;
  }, {});
  const itemTotalsList = Object.entries(itemTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Manage your bakery orders and production plans."
        action={
          <Button asChild>
            <Link href="/orders/new">New Order</Link>
          </Button>
        }
      />

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
          <h3 className="font-serif text-xl font-semibold text-text-primary">
            No orders yet
          </h3>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            Create your first order to start planning production. Select recipes,
            set quantities, and generate a production plan in minutes.
          </p>
          <Button asChild className="mt-6">
            <Link href="/orders/new">Create First Order</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h3 className="font-serif text-lg font-semibold text-text-primary">
              Item Totals
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Running totals from orders received.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {itemTotalsList.map(([name, quantity]) => (
                <Badge key={name} variant="secondary" className="px-3 py-1">
                  {name}: {quantity}
                </Badge>
              ))}
            </div>
          </div>

          <OrdersListClient orders={orders} />
        </div>
      )}
    </div>
  );
}
