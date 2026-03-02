import { notFound } from "next/navigation";
import { getOrders } from "@/lib/actions/orders";
import { requireAuth } from "@/lib/auth";
import { PrintControls } from "../print/print-controls";

type PrintTotalsPageProps = {
  searchParams: Promise<{
    view?: string;
    channel?: string;
  }>;
};

type ItemTotalsWithFlavors = {
  name: string;
  quantity: number;
  flavorTotals: Record<string, number>;
};

function getSelectionSummary(notes: string | null | undefined) {
  const trimmed = notes?.trim();
  if (!trimmed) return "";
  return trimmed.replace(/^(flavors?|flavor split)\s*:\s*/i, "").trim();
}

function parseFlavorSelections(notes: string | null | undefined, fallbackQty: number) {
  const summary = getSelectionSummary(notes);
  if (!summary) return {} as Record<string, number>;

  const parsed: Record<string, number> = {};
  for (const segment of summary.split(",")) {
    const match = segment.trim().match(/^(.*?)\s+x(\d+)$/i);
    if (!match) continue;
    const flavor = match[1].trim();
    const qty = Number(match[2]);
    if (!flavor || !Number.isFinite(qty) || qty <= 0) continue;
    parsed[flavor] = (parsed[flavor] ?? 0) + qty;
  }

  // Fallback for unexpected saved formats so the selection is still visible.
  if (Object.keys(parsed).length === 0) {
    parsed[summary] = fallbackQty;
  }

  return parsed;
}

export default async function OrderTotalsPrintPage({
  searchParams,
}: PrintTotalsPageProps) {
  await requireAuth();
  const params = await searchParams;
  const result = await getOrders();

  if (!result.success || !result.data) {
    notFound();
  }

  const view = params.view === "archived" ? "archived" : "active";
  const channel =
    params.channel === "rooted_community"
      ? "rooted_community"
      : params.channel === "main"
        ? "main"
        : "all";

  const filteredOrders = result.data
    .map((order) => {
      const orderChannel = order.name.startsWith("[Rooted Community]")
        ? ("rooted_community" as const)
        : ("main" as const);
      return { ...order, channel: orderChannel };
    })
    .filter((order) =>
      view === "archived" ? order.status === "archived" : order.status !== "archived"
    )
    .filter((order) => (channel === "all" ? true : order.channel === channel));

  const totalsByItem = filteredOrders.reduce<Record<string, ItemTotalsWithFlavors>>(
    (acc, order) => {
      for (const item of order.items ?? []) {
        const recipeName = item.recipe?.name ?? `Recipe #${item.recipeId}`;
        if (!acc[recipeName]) {
          acc[recipeName] = {
            name: recipeName,
            quantity: 0,
            flavorTotals: {},
          };
        }

        acc[recipeName].quantity += item.quantity;
        const flavorSelections = parseFlavorSelections(item.notes, item.quantity);
        for (const [flavor, qty] of Object.entries(flavorSelections)) {
          acc[recipeName].flavorTotals[flavor] =
            (acc[recipeName].flavorTotals[flavor] ?? 0) + qty;
        }
      }
      return acc;
    },
    {}
  );

  const itemTotals = Object.values(totalsByItem).sort((a, b) => b.quantity - a.quantity);

  const viewLabel = view === "archived" ? "Archived Orders" : "Active Orders";
  const channelLabel =
    channel === "rooted_community"
      ? "Rooted Community Orders"
      : channel === "main"
        ? "Main Orders"
        : "All Channels";

  return (
    <div className="mx-auto max-w-3xl p-4">
      <PrintControls />

      <article className="print-sheet rounded border border-border bg-surface p-4">
        <header className="border-b border-border pb-2">
          <h1 className="font-serif text-xl font-semibold text-text-primary">
            Item Totals
          </h1>
          <p className="mt-1 text-xs text-text-secondary">
            {viewLabel} • {channelLabel}
          </p>
        </header>

        {itemTotals.length === 0 ? (
          <p className="mt-4 text-sm text-text-secondary">No totals available.</p>
        ) : (
          <section className="mt-3 space-y-3">
            {itemTotals.map((item) => {
              const flavorEntries = Object.entries(item.flavorTotals).sort(
                (a, b) => b[1] - a[1]
              );
              return (
                <div key={item.name} className="rounded border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-text-primary">{item.name}</h2>
                    <span className="font-mono text-sm font-semibold text-text-primary">
                      {item.quantity}
                    </span>
                  </div>
                  {flavorEntries.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                      {flavorEntries.map(([flavor, qty]) => (
                        <li key={`${item.name}-${flavor}`} className="flex justify-between gap-2">
                          <span>{flavor}</span>
                          <span className="font-mono">{qty}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </section>
        )}
      </article>

      <style>{`
        @page {
          size: 4in 6in;
          margin: 0.18in;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-controls {
            display: none !important;
          }

          .print-sheet {
            width: 3.64in;
            min-height: 5.64in;
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
