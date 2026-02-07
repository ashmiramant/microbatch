import Link from "next/link";
import { getOrders } from "@/lib/actions/orders";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils/date";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  confirmed: { label: "Confirmed", variant: "default" },
  in_production: { label: "In Production", variant: "warning" },
  fulfilled: { label: "Fulfilled", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export default async function OrdersPage() {
  const result = await getOrders();
  const orders = result.success ? result.data ?? [] : [];

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
        <div className="rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Name</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const status = statusConfig[order.status ?? "draft"];
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-serif font-semibold text-text-primary hover:text-accent transition-colors"
                      >
                        {order.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {order.dueDate
                        ? formatDateTime(order.dueDate)
                        : "No due date"}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {order.items?.length ?? 0} recipe
                      {(order.items?.length ?? 0) !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
