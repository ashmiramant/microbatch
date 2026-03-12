"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, ChefHat, Copy } from "lucide-react";
import { updateRecipe, duplicateRecipe } from "@/lib/actions/recipes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RecipeCardProps {
  recipe: {
    id: number;
    name: string;
    slug: string;
    category: string | null;
    isSourdough: boolean | null;
    availableForMainOrder: boolean | null;
    availableForRootedOrder: boolean | null;
    yieldQuantity: string | null;
    yieldUnit: string | null;
    imageUrl: string | null;
    totalTimeMinutes: number | null;
  };
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [availableForMainOrder, setAvailableForMainOrder] = useState(
    !!recipe.availableForMainOrder
  );
  const [availableForRootedOrder, setAvailableForRootedOrder] = useState(
    !!recipe.availableForRootedOrder
  );

  function toggleMainForm() {
    const nextValue = !availableForMainOrder;
    setAvailableForMainOrder(nextValue);
    startTransition(async () => {
      const result = await updateRecipe(recipe.id, {
        availableForMainOrder: nextValue,
      });
      if (!result.success) {
        setAvailableForMainOrder(!nextValue);
      }
      router.refresh();
    });
  }

  function toggleRootedForm() {
    const nextValue = !availableForRootedOrder;
    setAvailableForRootedOrder(nextValue);
    startTransition(async () => {
      const result = await updateRecipe(recipe.id, {
        availableForRootedOrder: nextValue,
      });
      if (!result.success) {
        setAvailableForRootedOrder(!nextValue);
      }
      router.refresh();
    });
  }

  function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await duplicateRecipe(recipe.id);
      if (result.success && result.data?.id) {
        router.refresh();
        router.push(`/recipes/${result.data.id}`);
      }
    });
  }

  return (
    <Card className="overflow-hidden p-0 transition-all duration-200 hover:shadow-md">
      <Link href={`/recipes/${recipe.id}`} className="group block">
        {recipe.imageUrl ? (
          <div className="relative h-40 w-full overflow-hidden">
            <Image
              src={recipe.imageUrl}
              alt={recipe.name}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </div>
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-accent/5 to-accent/10">
            <ChefHat className="h-12 w-12 text-accent/30" />
          </div>
        )}

        <div className="p-5">
          <h3 className="truncate font-serif text-lg font-semibold text-text-primary">
            {recipe.name}
          </h3>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {recipe.category && (
              <Badge variant="secondary">{recipe.category}</Badge>
            )}
            {recipe.isSourdough && <Badge>Sourdough</Badge>}
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-text-secondary">
            {recipe.yieldQuantity && (
              <span>
                {recipe.yieldQuantity}
                {recipe.yieldUnit ? ` ${recipe.yieldUnit}` : ""}
              </span>
            )}
            {recipe.totalTimeMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(recipe.totalTimeMinutes)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="border-t border-border bg-background/50 px-4 py-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Order Forms
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={availableForMainOrder ? "default" : "outline"}
            disabled={isPending}
            onClick={toggleMainForm}
          >
            Main Form
          </Button>
          <Button
            type="button"
            size="sm"
            variant={availableForRootedOrder ? "default" : "outline"}
            disabled={isPending}
            onClick={toggleRootedForm}
          >
            Rooted Form
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start text-text-secondary"
          disabled={isPending}
          onClick={handleDuplicate}
        >
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </Button>
      </div>
    </Card>
  );
}
