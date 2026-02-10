"use client";

import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "@/lib/actions/ingredients";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type IngredientCategory =
  | "flour"
  | "sugar_sweetener"
  | "dairy"
  | "fat"
  | "leavening"
  | "salt_seasoning"
  | "fruit_veg"
  | "nut_seed"
  | "liquid"
  | "other";

type Ingredient = {
  id: number;
  name: string;
  aliases: unknown;
  subingredients: unknown;
  category: IngredientCategory | null;
  defaultUnit: string | null;
  densityGPerMl: string | null;
  costPerGram: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES: { value: IngredientCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "flour", label: "Flour" },
  { value: "sugar_sweetener", label: "Sugar / Sweetener" },
  { value: "dairy", label: "Dairy" },
  { value: "fat", label: "Fat" },
  { value: "leavening", label: "Leavening" },
  { value: "salt_seasoning", label: "Salt / Seasoning" },
  { value: "fruit_veg", label: "Fruit / Veg" },
  { value: "nut_seed", label: "Nut / Seed" },
  { value: "liquid", label: "Liquid" },
  { value: "other", label: "Other" },
];

const CATEGORY_LABELS: Record<string, string> = {
  flour: "Flour",
  sugar_sweetener: "Sugar / Sweetener",
  dairy: "Dairy",
  fat: "Fat",
  leavening: "Leavening",
  salt_seasoning: "Salt / Seasoning",
  fruit_veg: "Fruit / Veg",
  nut_seed: "Nut / Seed",
  liquid: "Liquid",
  other: "Other",
};

// ─── Form State ──────────────────────────────────────────────────────────────

type FormData = {
  name: string;
  category: IngredientCategory | "";
  defaultUnit: string;
  densityGPerMl: string;
  costPerGram: string;
  aliases: string;
  subingredients: string;
};

const emptyForm: FormData = {
  name: "",
  category: "",
  defaultUnit: "g",
  densityGPerMl: "",
  costPerGram: "",
  aliases: "",
  subingredients: "",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function IngredientsClient({
  ingredients,
}: {
  ingredients: Ingredient[];
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [isPending, startTransition] = useTransition();

  // ─── Filtering ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchesSearch = ing.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || ing.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [ingredients, search, categoryFilter]);

  // ─── Form Helpers ────────────────────────────────────────────────────────

  function openAdd() {
    setForm(emptyForm);
    setAddOpen(true);
  }

  function openEdit(ing: Ingredient) {
    setSelectedIngredient(ing);
    const aliasArray = Array.isArray(ing.aliases) ? ing.aliases : [];
    const subingredientArray = Array.isArray(ing.subingredients) ? ing.subingredients : [];
    setForm({
      name: ing.name,
      category: (ing.category ?? "") as IngredientCategory | "",
      defaultUnit: ing.defaultUnit ?? "g",
      densityGPerMl: ing.densityGPerMl ?? "",
      costPerGram: ing.costPerGram ?? "",
      aliases: aliasArray.join(", "),
      subingredients: subingredientArray.join(", "),
    });
    setEditOpen(true);
  }

  function openDelete(ing: Ingredient) {
    setSelectedIngredient(ing);
    setDeleteOpen(true);
  }

  function handleSubmitAdd() {
    startTransition(async () => {
      const aliases = form.aliases
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      const subingredients = form.subingredients
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await createIngredient({
        name: form.name,
        category: (form.category || null) as IngredientCategory | null,
        defaultUnit: form.defaultUnit || null,
        densityGPerMl: form.densityGPerMl || null,
        costPerGram: form.costPerGram || null,
        aliases: aliases.length > 0 ? aliases : undefined,
        subingredients: subingredients.length > 0 ? subingredients : undefined,
      });
      setAddOpen(false);
    });
  }

  function handleSubmitEdit() {
    if (!selectedIngredient) return;
    startTransition(async () => {
      const aliases = form.aliases
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      const subingredients = form.subingredients
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await updateIngredient(selectedIngredient.id, {
        name: form.name,
        category: (form.category || null) as IngredientCategory | null,
        defaultUnit: form.defaultUnit || null,
        densityGPerMl: form.densityGPerMl || null,
        costPerGram: form.costPerGram || null,
        aliases: aliases.length > 0 ? aliases : undefined,
        subingredients: subingredients.length > 0 ? subingredients : undefined,
      });
      setEditOpen(false);
      setSelectedIngredient(null);
    });
  }

  function handleDelete() {
    if (!selectedIngredient) return;
    startTransition(async () => {
      await deleteIngredient(selectedIngredient.id);
      setDeleteOpen(false);
      setSelectedIngredient(null);
    });
  }

  // ─── Shared Form ─────────────────────────────────────────────────────────

  const ingredientForm = (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. All-Purpose Flour"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={form.category}
          onValueChange={(val) =>
            setForm({ ...form, category: val as IngredientCategory })
          }
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="defaultUnit">Default Unit</Label>
          <Input
            id="defaultUnit"
            value={form.defaultUnit}
            onChange={(e) =>
              setForm({ ...form, defaultUnit: e.target.value })
            }
            placeholder="g"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="density">Density (g/mL)</Label>
          <Input
            id="density"
            type="number"
            step="0.01"
            value={form.densityGPerMl}
            onChange={(e) =>
              setForm({ ...form, densityGPerMl: e.target.value })
            }
            placeholder="e.g. 0.53"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cost">Cost per Gram ($)</Label>
        <Input
          id="cost"
          type="number"
          step="0.001"
          value={form.costPerGram}
          onChange={(e) => setForm({ ...form, costPerGram: e.target.value })}
          placeholder="e.g. 0.003"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="aliases">Aliases (comma-separated)</Label>
        <Input
          id="aliases"
          value={form.aliases}
          onChange={(e) => setForm({ ...form, aliases: e.target.value })}
          placeholder="e.g. AP flour, plain flour"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="subingredients">Subingredients (comma-separated)</Label>
        <Textarea
          id="subingredients"
          value={form.subingredients}
          onChange={(e) => setForm({ ...form, subingredients: e.target.value })}
          placeholder="e.g. Organic Hard Red Wheat flour, Organic Malted Barley Flour"
          rows={3}
        />
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Search + Filter Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ingredients..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Ingredient
          </Button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
          <h3 className="font-serif text-xl font-semibold text-text-primary">
            {ingredients.length === 0
              ? "No ingredients yet"
              : "No matching ingredients"}
          </h3>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            {ingredients.length === 0
              ? "Add your first ingredient to start building your pantry."
              : "Try adjusting your search or filter criteria."}
          </p>
          {ingredients.length === 0 && (
            <Button onClick={openAdd} className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              Add First Ingredient
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Default Unit</TableHead>
                <TableHead>Density (g/mL)</TableHead>
                <TableHead>Cost/g</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ing) => (
                <TableRow key={ing.id}>
                  <TableCell className="font-medium text-text-primary">
                    {ing.name}
                  </TableCell>
                  <TableCell>
                    {ing.category ? (
                      <Badge variant="secondary">
                        {CATEGORY_LABELS[ing.category] ?? ing.category}
                      </Badge>
                    ) : (
                      <span className="text-text-secondary">--</span>
                    )}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {ing.defaultUnit ?? "--"}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-text-secondary">
                    {ing.densityGPerMl ?? "--"}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-text-secondary">
                    {ing.costPerGram ? `$${ing.costPerGram}` : "--"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(ing)}
                        className="rounded-md p-1.5 text-text-secondary transition hover:bg-background hover:text-text-primary"
                        aria-label={`Edit ${ing.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDelete(ing)}
                        className="rounded-md p-1.5 text-text-secondary transition hover:bg-background hover:text-error"
                        aria-label={`Delete ${ing.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Ingredient</DialogTitle>
            <DialogDescription>
              Add a new ingredient to your pantry library.
            </DialogDescription>
          </DialogHeader>
          {ingredientForm}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAdd} disabled={!form.name || isPending}>
              {isPending ? "Adding..." : "Add Ingredient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ingredient</DialogTitle>
            <DialogDescription>
              Update the details for this ingredient.
            </DialogDescription>
          </DialogHeader>
          {ingredientForm}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={!form.name || isPending}
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ingredient</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-text-primary">
                {selectedIngredient?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
