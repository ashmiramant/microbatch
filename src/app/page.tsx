import Link from "next/link";
import {
  ChefHat,
  ShoppingCart,
  Factory,
  Plus,
  ArrowRight,
  Import,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRecipes } from "@/lib/actions/recipes";
import { getOrders } from "@/lib/actions/orders";
import { getProductionRuns } from "@/lib/actions/production";

export default async function DashboardPage() {
  const [recipesResult, ordersResult, runsResult] = await Promise.all([
    getRecipes().catch(() => ({ success: false as const, data: [] })),
    getOrders().catch(() => ({ success: false as const, data: [] })),
    getProductionRuns().catch(() => ({ success: false as const, data: [] })),
  ]);

  const recipes = recipesResult.success ? (recipesResult.data ?? []) : [];
  const orders = ordersResult.success ? (ordersResult.data ?? []) : [];
  const runs = runsResult.success ? (runsResult.data ?? []) : [];

  const activeOrders = orders.filter(
    (o) => o.status === "confirmed" || o.status === "in_production"
  );
  const activeRuns = runs.filter(
    (r) => r.status === "scheduled" || r.status === "in_progress"
  );

  const hasData = recipes.length > 0 || orders.length > 0 || runs.length > 0;

  return (
    <div>
      <PageHeader title="Dashboard" />

      {/* Quick stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Recipes</p>
                <p className="mt-1 font-mono text-3xl font-bold text-text-primary">
                  {recipes.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <ChefHat className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Active Orders</p>
                <p className="mt-1 font-mono text-3xl font-bold text-text-primary">
                  {activeOrders.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                <ShoppingCart className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">In Production</p>
                <p className="mt-1 font-mono text-3xl font-bold text-text-primary">
                  {activeRuns.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <Factory className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!hasData && (
        <Card className="mb-8">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <ChefHat className="h-8 w-8 text-accent" />
            </div>
            <h2 className="mb-2 font-serif text-2xl font-semibold text-text-primary">
              Welcome to MicroBatch
            </h2>
            <p className="mx-auto mb-6 max-w-md text-text-secondary">
              Your micro-bakery production management tool. Get started by
              creating your first recipe or importing one from a blog.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href="/recipes/new">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Recipe
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/recipes/import">
                  <Import className="mr-1.5 h-4 w-4" />
                  Import from URL
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      {hasData && (
        <div className="mb-8">
          <h2 className="mb-4 font-serif text-xl font-semibold text-text-primary">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/orders/new">
                <Plus className="mr-1.5 h-4 w-4" />
                New Order
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/recipes/new">
                <Plus className="mr-1.5 h-4 w-4" />
                New Recipe
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/recipes/import">
                <Import className="mr-1.5 h-4 w-4" />
                Import Recipe
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-text-primary">
              Active Orders
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orders">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeOrders.slice(0, 6).map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-text-primary">
                        {order.name}
                      </span>
                      <Badge
                        variant={
                          order.status === "in_production"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {order.status?.replace("_", " ")}
                      </Badge>
                    </div>
                    {order.dueDate && (
                      <p className="text-sm text-text-secondary">
                        Due:{" "}
                        {new Date(order.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Active production runs */}
      {activeRuns.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-text-primary">
              In Production
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/production">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeRuns.slice(0, 6).map((run) => (
              <Link key={run.id} href={`/production/${run.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-text-primary">
                        {run.name}
                      </span>
                      <Badge
                        variant={
                          run.status === "in_progress" ? "warning" : "secondary"
                        }
                      >
                        {run.status?.replace("_", " ")}
                      </Badge>
                    </div>
                    {run.targetCompletionAt && (
                      <p className="text-sm text-text-secondary">
                        Target:{" "}
                        {new Date(run.targetCompletionAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
