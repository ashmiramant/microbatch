"use client";

import { use, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
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
import { getRecipe, updateRecipe } from "@/lib/actions/recipes";
import { parseIngredients } from "@/lib/services/ingredient-parser";

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

const STEP_TYPES = [
  { value: "levain_build", label: "Levain Build" },
  { value: "autolyse", label: "Autolyse" },
  { value: "mix", label: "Mix" },
  { value: "bulk_ferment", label: "Bulk Ferment" },
  { value: "fold", label: "Fold" },
  { value: "shape", label: "Shape" },
  { value: "cold_proof", label: "Cold Proof" },
  { value: "warm_proof", label: "Warm Proof" },
  { value: "preheat", label: "Preheat" },
  { value: "score", label: "Score" },
  { value: "bake", label: "Bake" },
  { value: "cool", label: "Cool" },
  { value: "other", label: "Other" },
];

interface InstructionStep {
  text: string;
  stepType: string;
  durationMinutes: string;
  temperatureF: string;
}

export default function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const recipeId = parseInt(id, 10);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [isSourdough, setIsSourdough] = useState(false);
  const [availableForOrder, setAvailableForOrder] = useState(false);
  const [price, setPrice] = useState("");
  const [yieldQuantity, setYieldQuantity] = useState("");
  const [yieldUnit, setYieldUnit] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Ingredients
  const [ingredientText, setIngredientText] = useState("");

  // Instructions
  const [instructions, setInstructions] = useState<InstructionStep[]>([
    { text: "", stepType: "other", durationMinutes: "", temperatureF: "" },
  ]);

  // Additional
  const [prepTimeMinutes, setPrepTimeMinutes] = useState("");
  const [cookTimeMinutes, setCookTimeMinutes] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadRecipe() {
      const result = await getRecipe(recipeId);
      if (!result.success || !result.data) {
        setError("Recipe not found.");
        setLoading(false);
        return;
      }

      const r = result.data;
      setName(r.name);
      setDescription(r.description || "");
      setCategory(r.category || "");
      setIsSourdough(r.isSourdough || false);
      setAvailableForOrder(r.availableForOrder || false);
      setPrice(r.price || "");
      setYieldQuantity(r.yieldQuantity || "");
      setYieldUnit(r.yieldUnit || "");
      setImageUrl(r.imageUrl || "");
      setPrepTimeMinutes(r.prepTimeMinutes ? String(r.prepTimeMinutes) : "");
      setCookTimeMinutes(r.cookTimeMinutes ? String(r.cookTimeMinutes) : "");
      setNotes(r.notes || "");

      if (r.ingredients && r.ingredients.length > 0) {
        setIngredientText(
          r.ingredients.map((ing) => ing.rawText).join("\n")
        );
      }

      if (r.instructions && r.instructions.length > 0) {
        setInstructions(
          r.instructions.map((inst) => ({
            text: inst.text,
            stepType: inst.stepType || "other",
            durationMinutes: inst.durationMinutes
              ? String(inst.durationMinutes)
              : "",
            temperatureF: inst.temperatureF
              ? String(inst.temperatureF)
              : "",
          }))
        );
      }

      setLoading(false);
    }
    loadRecipe();
  }, [recipeId]);

  const parsedIngredients = useMemo(() => {
    const lines = ingredientText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return [];
    return parseIngredients(lines);
  }, [ingredientText]);

  const addStep = () => {
    setInstructions([
      ...instructions,
      { text: "", stepType: "other", durationMinutes: "", temperatureF: "" },
    ]);
  };

  const removeStep = (index: number) => {
    if (instructions.length <= 1) return;
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateStep = (
    index: number,
    field: keyof InstructionStep,
    value: string
  ) => {
    const updated = [...instructions];
    updated[index] = { ...updated[index], [field]: value };
    setInstructions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Recipe name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const ingredientLines = ingredientText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      const parsed = parseIngredients(ingredientLines);

      const prepTime = prepTimeMinutes ? parseInt(prepTimeMinutes, 10) : null;
      const cookTime = cookTimeMinutes ? parseInt(cookTimeMinutes, 10) : null;
      const totalTime =
        prepTime !== null || cookTime !== null
          ? (prepTime || 0) + (cookTime || 0)
          : null;

      const result = await updateRecipe(recipeId, {
        name: name.trim(),
        description: description.trim() || null,
        category: category || null,
        isSourdough: isSourdough || null,
        availableForOrder: availableForOrder || null,
        price: price.trim() || null,
        yieldQuantity: yieldQuantity.trim() || null,
        yieldUnit: yieldUnit.trim() || null,
        imageUrl: imageUrl.trim() || null,
        prepTimeMinutes: prepTime,
        cookTimeMinutes: cookTime,
        totalTimeMinutes: totalTime,
        notes: notes.trim() || null,
        ingredients: parsed.map((ing, i) => ({
          sortOrder: i,
          rawText: ing.rawText,
          quantity: ing.quantity !== null ? String(ing.quantity) : null,
          unit: ing.unit,
          unitGrams: ing.unitGrams !== null ? String(ing.unitGrams) : null,
          ingredientName: ing.ingredientName,
          prepNotes: ing.prepNotes,
          isFlour: ing.isFlour,
          bakersPercentage: null,
          sectionLabel: null,
        })),
        instructions: instructions
          .filter((inst) => inst.text.trim())
          .map((inst, i) => ({
            sortOrder: i,
            stepType: inst.stepType || null,
            name: null,
            text: inst.text.trim(),
            durationMinutes: inst.durationMinutes
              ? parseInt(inst.durationMinutes, 10)
              : null,
            temperatureF: inst.temperatureF
              ? parseInt(inst.temperatureF, 10)
              : null,
            sectionLabel: null,
          })),
      });

      if (result.success && result.data) {
        router.push(`/recipes/${result.data.id}`);
      } else {
        setError(result.error || "Failed to update recipe.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-24">
          <p className="text-text-secondary">Loading recipe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Edit Recipe" />

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Section 1: Basic Info */}
        <section className="space-y-5">
          <h2 className="font-serif text-xl font-semibold text-text-primary">
            Basic Information
          </h2>

          <div className="space-y-2">
            <Label htmlFor="name">
              Recipe Name <span className="text-accent">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Country Sourdough Loaf"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this recipe..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
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
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="11.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="yield-quantity">Yield Quantity</Label>
              <Input
                id="yield-quantity"
                value={yieldQuantity}
                onChange={(e) => setYieldQuantity(e.target.value)}
                placeholder="e.g., 2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yield-unit">Yield Unit</Label>
              <Input
                id="yield-unit"
                value={yieldUnit}
                onChange={(e) => setYieldUnit(e.target.value)}
                placeholder="e.g., loaves"
              />
            </div>
            <div className="flex items-end pb-0.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is-sourdough"
                  checked={isSourdough}
                  onCheckedChange={(checked) =>
                    setIsSourdough(checked === true)
                  }
                />
                <Label htmlFor="is-sourdough" className="cursor-pointer">
                  Sourdough
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-4">
            <Checkbox
              id="available-for-order"
              checked={availableForOrder}
              onCheckedChange={(checked) =>
                setAvailableForOrder(checked === true)
              }
            />
            <Label htmlFor="available-for-order" className="cursor-pointer">
              Available for customer orders
            </Label>
          </div>
        </section>

        <Separator />

        {/* Section 2: Ingredients */}
        <section className="space-y-5">
          <h2 className="font-serif text-xl font-semibold text-text-primary">
            Ingredients
          </h2>
          <p className="text-sm text-text-secondary">
            One ingredient per line.
          </p>

          <Textarea
            value={ingredientText}
            onChange={(e) => setIngredientText(e.target.value)}
            placeholder={`500g bread flour\n350g water\n100g active starter\n10g salt`}
            rows={8}
            className="font-mono text-sm"
          />

          {parsedIngredients.length > 0 && (
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                Parsed Preview
              </p>
              <div className="space-y-1.5">
                {parsedIngredients.map((ing, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-baseline gap-3 text-sm",
                      ing.isFlour && "text-accent"
                    )}
                  >
                    <span className="w-16 text-right font-mono text-text-secondary">
                      {ing.quantity !== null ? ing.quantity : "--"}
                      {ing.unit ? ` ${ing.unit}` : ""}
                    </span>
                    <span className="flex-1 font-medium text-text-primary">
                      {ing.ingredientName}
                    </span>
                    {ing.unitGrams !== null && (
                      <span className="font-mono text-text-secondary">
                        {ing.unitGrams.toFixed(
                          ing.unitGrams >= 10 ? 0 : 1
                        )}{" "}
                        g
                      </span>
                    )}
                    {ing.prepNotes && (
                      <span className="text-xs italic text-text-tertiary">
                        {ing.prepNotes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <Separator />

        {/* Section 3: Instructions */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-text-primary">
              Instructions
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addStep}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Step
            </Button>
          </div>

          <div className="space-y-4">
            {instructions.map((step, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 font-mono text-xs font-medium text-accent">
                      {index + 1}
                    </span>
                    <Select
                      value={step.stepType}
                      onValueChange={(val) =>
                        updateStep(index, "stepType", val)
                      }
                    >
                      <SelectTrigger className="h-8 w-[160px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STEP_TYPES.map((st) => (
                          <SelectItem key={st.value} value={st.value}>
                            {st.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(index)}
                    disabled={instructions.length <= 1}
                    className="h-8 w-8 p-0 text-text-tertiary hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <Textarea
                  value={step.text}
                  onChange={(e) => updateStep(index, "text", e.target.value)}
                  placeholder="Describe this step..."
                  rows={2}
                  className="mb-3"
                />

                <div className="flex gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-text-tertiary">
                      Duration (min)
                    </Label>
                    <Input
                      type="number"
                      value={step.durationMinutes}
                      onChange={(e) =>
                        updateStep(index, "durationMinutes", e.target.value)
                      }
                      className="h-8 w-24 text-xs"
                      min={0}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-text-tertiary">
                      Temp (&deg;F)
                    </Label>
                    <Input
                      type="number"
                      value={step.temperatureF}
                      onChange={(e) =>
                        updateStep(index, "temperatureF", e.target.value)
                      }
                      className="h-8 w-24 text-xs"
                      min={0}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* Section 4: Additional */}
        <section className="space-y-5">
          <h2 className="font-serif text-xl font-semibold text-text-primary">
            Additional Details
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prep-time">Prep Time (minutes)</Label>
              <Input
                id="prep-time"
                type="number"
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(e.target.value)}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cook-time">Cook Time (minutes)</Label>
              <Input
                id="cook-time"
                type="number"
                value={cookTimeMinutes}
                onChange={(e) => setCookTimeMinutes(e.target.value)}
                min={0}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this recipe..."
              rows={4}
            />
          </div>
        </section>

        {/* Error and submit */}
        {error && (
          <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/recipes/${recipeId}`)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
