"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateProductionRunStatus,
  deleteProductionRun,
} from "@/lib/actions/production";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusFlow: Record<string, string[]> = {
  draft: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface ProductionRunActionsProps {
  runId: number;
  currentStatus: string;
}

export function ProductionRunActions({
  runId,
  currentStatus,
}: ProductionRunActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const allowedStatuses = statusFlow[currentStatus] ?? [];

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      await updateProductionRunStatus(
        runId,
        newStatus as
          | "draft"
          | "scheduled"
          | "in_progress"
          | "completed"
          | "cancelled"
      );
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteProductionRun(runId);
      router.push("/production");
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
