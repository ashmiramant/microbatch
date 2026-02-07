"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecipeCardProps {
  recipe: {
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
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="group block">
      <Card className="overflow-hidden p-0 transition-all duration-200 hover:shadow-md group-hover:scale-[1.02]">
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
      </Card>
    </Link>
  );
}
