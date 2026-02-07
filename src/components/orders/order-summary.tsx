"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderSummaryProps {
  items: Array<{ recipeId: number; recipeName: string; quantity: number }>;
  dueDate: string;
  onDueDateChange: (date: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function OrderSummary({
  items,
  dueDate,
  onDueDateChange,
  onSubmit,
  isSubmitting,
}: OrderSummaryProps) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-surface">
      <div className="border-b border-border p-6">
        <h3 className="font-serif text-lg font-semibold text-text-primary">
          Order Summary
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          {items.length === 0
            ? "Select recipes and quantities to get started"
            : `${items.length} recipe${items.length !== 1 ? "s" : ""}, ${totalItems} total items`}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {items.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipe</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.recipeId}>
                  <TableCell className="font-serif font-medium">
                    {item.recipeName}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {item.quantity}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-text-secondary">
              No items selected yet.
            </p>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="due-date">Due Date &amp; Time</Label>
          <Input
            id="due-date"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
          />
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={onSubmit}
          disabled={items.length === 0 || isSubmitting}
        >
          {isSubmitting ? "Creating Order..." : "Create Order & Generate Plan"}
        </Button>
      </div>
    </div>
  );
}
