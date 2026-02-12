import { notFound } from "next/navigation";
import { getOrders } from "@/lib/actions/orders";
import { requireAuth } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils/date";
import { PrintControls } from "./print-controls";

type PrintPageProps = {
  searchParams: Promise<{
    ids?: string;
    all?: string;
  }>;
};

export default async function OrdersPrintPage({ searchParams }: PrintPageProps) {
  await requireAuth();
  const params = await searchParams;
  const result = await getOrders();

  if (!result.success || !result.data) {
    notFound();
  }

  const allOrders = result.data;
  const printAll = params.all === "1";
  const ids = (params.ids ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));

  const ordersToPrint = printAll
    ? allOrders
    : allOrders.filter((order) => ids.includes(order.id));

  if (ordersToPrint.length === 0) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <p className="text-sm text-text-secondary">No orders selected to print.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <PrintControls />

      {ordersToPrint.map((order) => (
        <article key={order.id} className="print-sheet rounded border border-border p-4">
          <header className="border-b border-border pb-2">
            <h1 className="font-serif text-xl font-semibold text-text-primary">
              {order.name}
            </h1>
            <p className="mt-1 text-xs text-text-secondary">
              Order Date: {order.createdAt ? formatDateTime(order.createdAt) : "No date"}
            </p>
            <p className="text-xs text-text-secondary">
              Status: {(order.status ?? "draft").replaceAll("_", " ")}
            </p>
          </header>

          <section className="mt-3">
            <h2 className="text-sm font-semibold text-text-primary">Items</h2>
            {order.items.length > 0 ? (
              <ul className="mt-1 space-y-1 text-sm text-text-primary">
                {order.items.map((item) => {
                  const recipeName = item.recipe?.name ?? `Recipe #${item.recipeId}`;
                  return (
                    <li key={item.id} className="flex justify-between gap-2">
                      <span className="truncate pr-2">{recipeName}</span>
                      <span className="font-mono">x{item.quantity}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-text-secondary">No items.</p>
            )}
          </section>

          {order.notes ? (
            <section className="mt-3 border-t border-border pt-2">
              <h2 className="text-sm font-semibold text-text-primary">Notes</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">
                {order.notes}
              </p>
            </section>
          ) : null}
        </article>
      ))}

      <style>{`
        @page {
          size: 4in 6in;
          margin: 0.18in;
        }

        @media print {
          .print-controls {
            display: none !important;
          }

          .print-sheet {
            width: 3.64in;
            min-height: 5.64in;
            page-break-after: always;
            break-after: page;
            border: 1px solid #e5e7eb;
            border-radius: 0;
            padding: 0.18in;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
