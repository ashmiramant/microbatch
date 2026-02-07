"use client";

import { use, useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { getProductionRun } from "@/lib/actions/production";
import {
  getShoppingLists,
  createShoppingList,
  updateShoppingListItem,
} from "@/lib/actions/packaging";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

type ShoppingItem = {
  id: number;
  name: string;
  quantityDisplay: string | null;
  quantityNeededGrams: string | null;
  isPurchased: boolean | null;
  category?: string | null;
};

type ShoppingListData = {
  id: number;
  name: string;
  items: ShoppingItem[];
};

export default function ShoppingListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [runName, setRunName] = useState("");
  const [shoppingList, setShoppingList] = useState<ShoppingListData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function fetchData() {
      const runResult = await getProductionRun(Number(id));
      if (runResult.success && runResult.data) {
        setRunName(runResult.data.name);
      }

      // Find existing shopping list for this run
      const listsResult = await getShoppingLists();
      if (listsResult.success && listsResult.data) {
        const existing = listsResult.data.find(
          (l) => l.productionRunId === Number(id)
        );
        if (existing) {
          setShoppingList({
            id: existing.id,
            name: existing.name,
            items: existing.items.map((item) => ({
              id: item.id,
              name: item.name,
              quantityDisplay: item.quantityDisplay,
              quantityNeededGrams: item.quantityNeededGrams,
              isPurchased: item.isPurchased,
            })),
          });
        }
      }

      setLoading(false);
    }
    fetchData();
  }, [id]);

  const handleTogglePurchased = (itemId: number, currentValue: boolean) => {
    startTransition(async () => {
      const result = await updateShoppingListItem(itemId, !currentValue);
      if (result.success) {
        setShoppingList((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((item) =>
                  item.id === itemId
                    ? { ...item, isPurchased: !currentValue }
                    : item
                ),
              }
            : null
        );
      }
    });
  };

  const handleCreateList = () => {
    startTransition(async () => {
      const result = await createShoppingList({
        name: `Shopping List: ${runName}`,
        productionRunId: Number(id),
        status: "active",
        items: [],
      });
      if (result.success && result.data) {
        setShoppingList({
          id: result.data.id,
          name: result.data.name,
          items: [],
        });
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Shopping List" description="Loading..." />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  const purchasedCount =
    shoppingList?.items.filter((i) => i.isPurchased).length ?? 0;
  const totalCount = shoppingList?.items.length ?? 0;

  return (
    <div>
      <PageHeader
        title={`Shopping List: ${runName}`}
        description={
          shoppingList
            ? `${purchasedCount} of ${totalCount} items purchased`
            : "No shopping list created yet"
        }
        action={
          <div className="flex items-center gap-2">
            {shoppingList && (
              <Button variant="outline" onClick={handlePrint}>
                Print
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={`/production/${id}`}>Back to Run</Link>
            </Button>
          </div>
        }
      />

      {!shoppingList ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
          <h3 className="font-serif text-xl font-semibold text-text-primary">
            No shopping list yet
          </h3>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            Create a shopping list to track the ingredients you need to purchase
            for this production run.
          </p>
          <Button className="mt-6" onClick={handleCreateList} disabled={isPending}>
            {isPending ? "Creating..." : "Create Shopping List"}
          </Button>
        </div>
      ) : shoppingList.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
          <h3 className="font-serif text-xl font-semibold text-text-primary">
            Shopping list is empty
          </h3>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            Items will appear here once they are aggregated from your production
            batches.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{shoppingList.name}</CardTitle>
              {totalCount > 0 && (
                <Badge variant={purchasedCount === totalCount ? "success" : "secondary"}>
                  {purchasedCount}/{totalCount}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress bar */}
            {totalCount > 0 && (
              <div className="mb-6">
                <div className="h-2 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-success transition-all"
                    style={{
                      width: `${(purchasedCount / totalCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              {shoppingList.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg px-3 py-3 transition hover:bg-background"
                >
                  <Checkbox
                    checked={item.isPurchased ?? false}
                    onCheckedChange={() =>
                      handleTogglePurchased(item.id, item.isPurchased ?? false)
                    }
                    disabled={isPending}
                  />
                  <div className="flex flex-1 items-center justify-between gap-4">
                    <span
                      className={`text-sm text-text-primary ${item.isPurchased ? "line-through opacity-60" : ""}`}
                    >
                      {item.name}
                    </span>
                    <span
                      className={`shrink-0 font-mono text-sm text-text-secondary ${item.isPurchased ? "line-through opacity-60" : ""}`}
                    >
                      {item.quantityDisplay ??
                        (item.quantityNeededGrams
                          ? `${item.quantityNeededGrams}g`
                          : "")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
