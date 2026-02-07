"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "Bread",
  "Pastry",
  "Cake",
  "Cookie",
  "Pie",
  "Enriched Dough",
  "Flatbread",
  "Other",
];

interface ImportPreviewProps {
  recipe: {
    name: string;
    description: string | null;
    imageUrl: string | null;
    ingredients: string[];
    instructions: Array<{ text: string; name?: string }>;
    yieldText: string | null;
    prepTime: number | null;
    cookTime: number | null;
    totalTime: number | null;
  };
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

export function ImportPreview({ recipe, onSave, onCancel }: ImportPreviewProps) {
  const [name, setName] = useState(recipe.name || "");
  const [description, setDescription] = useState(recipe.description || "");
  const [category, setCategory] = useState<string>("");
  const [isSourdough, setIsSourdough] = useState(false);
  const [yieldText, setYieldText] = useState(recipe.yieldText || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        name,
        description: description || null,
        imageUrl: recipe.imageUrl,
        category: category || null,
        isSourdough,
        yieldQuantity: yieldText || null,
        prepTimeMinutes: recipe.prepTime,
        cookTimeMinutes: recipe.cookTime,
        totalTimeMinutes: recipe.totalTime,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Image preview */}
      {recipe.imageUrl && (
        <div className="relative h-48 w-full overflow-hidden rounded-lg">
          <Image
            src={recipe.imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 700px"
          />
        </div>
      )}

      {/* Basic info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipe-name">Recipe Name</Label>
          <Input
            id="recipe-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Recipe name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipe-description">Description</Label>
          <Textarea
            id="recipe-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Recipe description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="recipe-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="recipe-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat.toLowerCase()}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipe-yield">Yield</Label>
            <Input
              id="recipe-yield"
              value={yieldText}
              onChange={(e) => setYieldText(e.target.value)}
              placeholder="e.g., 2 loaves"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="is-sourdough"
            checked={isSourdough}
            onCheckedChange={(checked) => setIsSourdough(checked === true)}
          />
          <Label htmlFor="is-sourdough" className="cursor-pointer">
            This is a sourdough recipe
          </Label>
        </div>
      </div>

      <Separator />

      {/* Ingredients preview */}
      <div className="space-y-3">
        <h3 className="font-serif text-lg font-semibold text-text-primary">
          Ingredients
        </h3>
        <div className="rounded-lg border border-border bg-background p-4">
          <ul className="space-y-1.5">
            {(recipe.ingredients || []).map((ing, i) => (
              <li
                key={i}
                className="text-sm text-text-secondary"
              >
                {ing}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Separator />

      {/* Instructions preview */}
      <div className="space-y-3">
        <h3 className="font-serif text-lg font-semibold text-text-primary">
          Instructions
        </h3>
        <div className="space-y-3">
          {(recipe.instructions || []).map((inst, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 font-mono text-xs font-medium text-accent">
                  {i + 1}
                </span>
                <div>
                  {inst.name && (
                    <p className="mb-1 font-medium text-text-primary">
                      {inst.name}
                    </p>
                  )}
                  <p className="text-sm text-text-secondary">{inst.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? "Saving..." : "Save Recipe"}
        </Button>
      </div>
    </div>
  );
}
