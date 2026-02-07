import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getRecipes } from "@/lib/actions/recipes";
import { RecipeListFilters } from "@/components/recipes/recipe-list-filters";

export default async function RecipesPage() {
  const result = await getRecipes();
  const recipes = result.success && result.data ? result.data : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Recipes"
        description="Your recipe library"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/recipes/import">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Link>
            </Button>
            <Button asChild>
              <Link href="/recipes/new">
                <Plus className="mr-2 h-4 w-4" />
                New Recipe
              </Link>
            </Button>
          </div>
        }
      />

      <RecipeListFilters recipes={recipes} />
    </div>
  );
}
