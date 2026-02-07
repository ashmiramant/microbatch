"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RecipeCard } from "@/components/recipes/recipe-card";

type RecipeSummary = {
  id: number;
  name: string;
  slug: string;
  category: string | null;
  isSourdough: boolean | null;
  yieldQuantity: string | null;
  yieldUnit: string | null;
  imageUrl: string | null;
  totalTimeMinutes: number | null;
};

interface RecipeListFiltersProps {
  recipes: RecipeSummary[];
}

export function RecipeListFilters({ recipes }: RecipeListFiltersProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sourdoughOnly, setSourdoughOnly] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    recipes.forEach((r) => {
      if (r.category) cats.add(r.category);
    });
    return Array.from(cats).sort();
  }, [recipes]);

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (selectedCategory && r.category !== selectedCategory) {
        return false;
      }
      if (sourdoughOnly && !r.isSourdough) {
        return false;
      }
      return true;
    });
  }, [recipes, search, selectedCategory, sourdoughOnly]);

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={selectedCategory === null ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
            >
              {cat}
            </Badge>
          ))}

          <div className="ml-2 h-5 w-px bg-border" />

          <Badge
            variant={sourdoughOnly ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setSourdoughOnly(!sourdoughOnly)}
          >
            Sourdough
          </Badge>
        </div>
      </div>

      {/* Recipe grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          {recipes.length === 0 ? (
            <div className="space-y-3">
              <p className="font-serif text-xl text-text-secondary">
                No recipes yet
              </p>
              <p className="text-sm text-text-tertiary">
                Create your first recipe or import one from a blog.
              </p>
            </div>
          ) : (
            <p className="text-text-secondary">
              No recipes match your filters. Try adjusting your search.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
