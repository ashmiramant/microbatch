"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { archiveOrder, unarchiveOrder } from "@/lib/actions/orders";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils/date";

type OrderListItem = {
  id: number;
  name: string;
  channel?: "main" | "rooted_community";
  status: string | null;
  createdAt: Date | null;
  items: Array<{
    recipeId: number;
    quantity: number;
    recipe: {
      name: string;
    } | null;
  }>;
};

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

export function OrdersListClient({ orders }: { orders: OrderListItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);

  const allOrderIds = useMemo(() => orders.map((order) => order.id), [orders]);
  const allSelected =
    orders.length > 0 && selectedOrderIds.length === orders.length;

  function toggleSelectAll(checked: boolean) {
    setSelectedOrderIds(checked ? allOrderIds : []);
  }

  function toggleSelectOrder(orderId: number, checked: boolean) {
    setSelectedOrderIds((prev) => {
      if (checked) {
        if (prev.includes(orderId)) return prev;
        return [...prev, orderId];
      }
      return prev.filter((id) => id !== orderId);
    });
  }

  function handlePrintSelected() {
    if (selectedOrderIds.length === 0) return;
    const ids = selectedOrderIds.join(",");
    window.open(
      `/orders/print?ids=${encodeURIComponent(ids)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function handleArchive(orderId: number) {
    startTransition(async () => {
      await archiveOrder(orderId);
      router.refresh();
    });
  }

  function handleUnarchive(orderId: number) {
    startTransition(async () => {
      await unarchiveOrder(orderId);
      router.refresh();
    });
  }

  function handleArchiveSelected() {
    if (selectedOrderIds.length === 0) return;
    startTransition(async () => {
      const selectedOrders = orders.filter((order) =>
        selectedOrderIds.includes(order.id)
      );
      const activeOrders = selectedOrders.filter(
        (order) => order.status !== "archived"
      );
      await Promise.all(activeOrders.map((order) => archiveOrder(order.id)));
      setSelectedOrderIds([]);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <p className="text-sm text-text-secondary">
          Select one or more orders to print or archive.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleArchiveSelected}
            disabled={selectedOrderIds.length === 0 || isPending}
          >
            Archive Selected ({selectedOrderIds.length})
          </Button>
          <Button
            onClick={handlePrintSelected}
            disabled={selectedOrderIds.length === 0}
          >
            Print Selected ({selectedOrderIds.length})
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <input
                type="checkbox"
                aria-label="Select all orders"
                checked={allSelected}
                onChange={(e) => toggleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
            </TableHead>
            <TableHead>Order Name</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Items Ordered</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const status = statusConfig[order.status ?? "draft"];
            const isSelected = selectedOrderIds.includes(order.id);
            const orderChannel =
              order.channel ??
              (order.name.startsWith("[Rooted Community]")
                ? "rooted_community"
                : "main");
            const displayName = order.name
              .replace(/^\[Rooted Community\]\s*/i, "")
              .replace(/^\[Main\]\s*/i, "");

            return (
              <TableRow key={order.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`Select order ${order.name}`}
                    checked={isSelected}
                    onChange={(e) => toggleSelectOrder(order.id, e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/orders/${order.id}`}
                    className="font-serif font-semibold text-text-primary transition-colors hover:text-accent"
                  >
                    {displayName}
                  </Link>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {orderChannel === "rooted_community"
                        ? "Rooted Community"
                        : "Main"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-text-secondary">
                  {order.createdAt ? formatDateTime(order.createdAt) : "No date"}
                </TableCell>
                <TableCell className="text-text-secondary">
                  {order.items.length ? (
                    <div className="max-w-[360px] truncate">
                      {order.items
                        .map((item) => {
                          const recipeName =
                            item.recipe?.name ?? `Recipe #${item.recipeId}`;
                          return `${recipeName} x${item.quantity}`;
                        })
                        .join(", ")}
                    </div>
                  ) : (
                    "No items"
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/orders/${order.id}/edit`}>Edit</Link>
                    </Button>
                    {order.status === "archived" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnarchive(order.id)}
                        disabled={isPending}
                      >
                        Unarchive
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(order.id)}
                        disabled={isPending}
                      >
                        Archive
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
