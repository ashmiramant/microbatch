import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/actions/orders";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils/date";
import { OrderStatusActions } from "./order-status-actions";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  confirmed: { label: "Confirmed", variant: "default" },
  in_production: { label: "In Production", variant: "warning" },
  fulfilled: { label: "Fulfilled", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  archived: { label: "Archived", variant: "secondary" },
};

function getConfirmationEmailSentAt(notes: string | null) {
  if (!notes) return "";
  const match = notes.match(/^Confirmation Email Sent At:\s*(.+)$/im);
  return (match?.[1] ?? "").trim();
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getOrder(Number(id));

  if (!result.success || !result.data) {
    notFound();
  }

  const order = result.data;
  const status = statusConfig[order.status ?? "draft"];
  const orderChannel = order.name.startsWith("[Rooted Community]")
    ? "rooted_community"
    : "main";
  const displayOrderName = order.name
    .replace(/^\[Rooted Community\]\s*/i, "")
    .replace(/^\[Main\]\s*/i, "");
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const confirmationEmailSentAt = getConfirmationEmailSentAt(order.notes);

  return (
    <div>
      <PageHeader
        title={displayOrderName}
        action={
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {orderChannel === "rooted_community" ? "Rooted Community" : "Main"}
            </Badge>
            <Badge variant={status.variant} className="text-sm px-3 py-1">
              {status.label}
            </Badge>
            <OrderStatusActions orderId={order.id} currentStatus={order.status ?? "draft"} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="space-y-6">
          {/* Order items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              {order.items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipe</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => {
                      const unitPrice = item.unitPrice
                        ? parseFloat(item.unitPrice)
                        : 0;
                      const subtotal = unitPrice * item.quantity;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-serif font-medium">
                            {item.recipe?.name ?? `Recipe #${item.recipeId}`}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right text-text-secondary">
                            {unitPrice > 0 ? `$${unitPrice.toFixed(2)}` : "--"}
                          </TableCell>
                          <TableCell className="text-right text-text-secondary">
                            {subtotal > 0 ? `$${subtotal.toFixed(2)}` : "--"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold">Total</TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {totalQuantity}
                      </TableCell>
                      <TableCell />
                      <TableCell className="text-right font-mono font-semibold">
                        {order.items.some((i) => i.unitPrice && parseFloat(i.unitPrice) > 0)
                          ? `$${order.items
                              .reduce(
                                (sum, i) =>
                                  sum +
                                  (i.unitPrice ? parseFloat(i.unitPrice) : 0) *
                                    i.quantity,
                                0
                              )
                              .toFixed(2)}`
                          : "--"}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              ) : (
                <p className="py-4 text-center text-sm text-text-secondary">
                  No items in this order.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-text-secondary">
                  {order.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                  Created
                </p>
                <p className="mt-1 text-sm text-text-primary">
                  {order.createdAt ? formatDateTime(order.createdAt) : "--"}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                  Last Updated
                </p>
                <p className="mt-1 text-sm text-text-primary">
                  {order.updatedAt ? formatDateTime(order.updatedAt) : "--"}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                  Confirmation Email
                </p>
                <p className="mt-1 text-sm text-text-primary">
                  {confirmationEmailSentAt
                    ? `Sent ${formatDateTime(new Date(confirmationEmailSentAt))}`
                    : "Not sent yet"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/orders/${order.id}/edit`}>Edit This Order</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/production">View Production Runs</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/orders">Back to Orders</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
