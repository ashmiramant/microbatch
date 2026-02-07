"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, deleteOrder } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusFlow: Record<string, string[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["in_production", "cancelled"],
  in_production: ["fulfilled", "cancelled"],
  fulfilled: [],
  cancelled: [],
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  in_production: "In Production",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

interface OrderStatusActionsProps {
  orderId: number;
  currentStatus: string;
}

export function OrderStatusActions({
  orderId,
  currentStatus,
}: OrderStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const allowedStatuses = statusFlow[currentStatus] ?? [];

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      await updateOrderStatus(
        orderId,
        newStatus as "draft" | "confirmed" | "in_production" | "fulfilled" | "cancelled"
      );
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteOrder(orderId);
      router.push("/orders");
    });
  };

  return (
    <div className="flex items-center gap-2">
      {allowedStatuses.length > 0 && (
        <Select onValueChange={handleStatusChange} disabled={isPending}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Update status" />
          </SelectTrigger>
          <SelectContent>
            {allowedStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showDeleteConfirm ? (
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
          >
            Confirm Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-text-secondary hover:text-error"
        >
          Delete
        </Button>
      )}
    </div>
  );
}
