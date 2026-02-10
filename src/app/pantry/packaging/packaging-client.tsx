"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { NumberStepper } from "@/components/ui/number-stepper";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import {
  createPackagingType,
  updatePackagingType,
  deletePackagingType,
  updatePackagingStock,
} from "@/lib/actions/packaging";
import { Plus, Pencil, Trash2, AlertTriangle, ExternalLink } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type PackagingCategory =
  | "bag"
  | "box"
  | "wrapper"
  | "sticker"
  | "label"
  | "tie"
  | "other";

type PackagingType = {
  id: number;
  name: string;
  category: PackagingCategory | null;
  costPerUnit: string | null;
  currentStock: number | null;
  reorderThreshold: number | null;
  supplierUrl: string | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const PACKAGING_CATEGORIES: { value: PackagingCategory; label: string }[] = [
  { value: "bag", label: "Bag" },
  { value: "box", label: "Box" },
  { value: "wrapper", label: "Wrapper" },
  { value: "sticker", label: "Sticker" },
  { value: "label", label: "Label" },
  { value: "tie", label: "Tie" },
  { value: "other", label: "Other" },
];

const CATEGORY_LABELS: Record<string, string> = {
  bag: "Bag",
  box: "Box",
  wrapper: "Wrapper",
  sticker: "Sticker",
  label: "Label",
  tie: "Tie",
  other: "Other",
};

// ─── Form State ──────────────────────────────────────────────────────────────

type FormData = {
  name: string;
  category: PackagingCategory | "";
  costPerUnit: string;
  currentStock: string;
  reorderThreshold: string;
  supplierUrl: string;
  notes: string;
};

const emptyForm: FormData = {
  name: "",
  category: "",
  costPerUnit: "",
  currentStock: "0",
  reorderThreshold: "0",
  supplierUrl: "",
  notes: "",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function PackagingClient({
  packagingTypes,
}: {
  packagingTypes: PackagingType[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PackagingType | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [isPending, startTransition] = useTransition();

  // ─── Form Helpers ────────────────────────────────────────────────────────

  function openAdd() {
    setForm(emptyForm);
    setAddOpen(true);
  }

  function openEdit(item: PackagingType) {
    setSelectedItem(item);
    setForm({
      name: item.name,
      category: (item.category ?? "") as PackagingCategory | "",
      costPerUnit: item.costPerUnit ?? "",
      currentStock: String(item.currentStock ?? 0),
      reorderThreshold: String(item.reorderThreshold ?? 0),
      supplierUrl: item.supplierUrl ?? "",
      notes: item.notes ?? "",
    });
    setEditOpen(true);
  }

  function openDelete(item: PackagingType) {
    setSelectedItem(item);
    setDeleteOpen(true);
  }

  function handleSubmitAdd() {
    startTransition(async () => {
      await createPackagingType({
        name: form.name,
        category: (form.category || null) as PackagingCategory | null,
        costPerUnit: form.costPerUnit || null,
        currentStock: form.currentStock ? parseInt(form.currentStock) : 0,
        reorderThreshold: form.reorderThreshold
          ? parseInt(form.reorderThreshold)
          : 0,
        supplierUrl: form.supplierUrl || null,
        notes: form.notes || null,
      });
      setAddOpen(false);
    });
  }

  function handleSubmitEdit() {
    if (!selectedItem) return;
    startTransition(async () => {
      await updatePackagingType(selectedItem.id, {
        name: form.name,
        category: (form.category || null) as PackagingCategory | null,
        costPerUnit: form.costPerUnit || null,
        currentStock: form.currentStock ? parseInt(form.currentStock) : 0,
        reorderThreshold: form.reorderThreshold
          ? parseInt(form.reorderThreshold)
          : 0,
        supplierUrl: form.supplierUrl || null,
        notes: form.notes || null,
      });
      setEditOpen(false);
      setSelectedItem(null);
    });
  }

  function handleDelete() {
    if (!selectedItem) return;
    startTransition(async () => {
      await deletePackagingType(selectedItem.id);
      setDeleteOpen(false);
      setSelectedItem(null);
    });
  }

  function handleStockUpdate(item: PackagingType, newStock: number) {
    startTransition(async () => {
      await updatePackagingStock(item.id, newStock);
    });
  }

  // ─── Low Stock Check ─────────────────────────────────────────────────────

  function isLowStock(item: PackagingType) {
    const stock = item.currentStock ?? 0;
    const threshold = item.reorderThreshold ?? 0;
    return stock <= threshold;
  }

  // ─── URL Scraping ────────────────────────────────────────────────────────

  const [scraping, setScraping] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");

  async function handleScrapeUrl() {
    if (!scrapeUrl.trim()) return;
    
    setScraping(true);
    try {
      const response = await fetch("/api/scrape-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl }),
      });

      const data = await response.json();

      if (response.ok && data.product) {
        const product = data.product;
        setForm({
          ...form,
          name: product.name || form.name,
          costPerUnit: product.price || form.costPerUnit,
          supplierUrl: scrapeUrl,
        });
        setScrapeUrl("");
      } else {
        alert(data.error || "Couldn't scrape product info from that URL");
      }
    } catch (error) {
      alert("Failed to scrape URL. Please enter details manually.");
    } finally {
      setScraping(false);
    }
  }

  // ─── Shared Form ─────────────────────────────────────────────────────────

  const packagingForm = (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="scrape-url">Quick Import from URL (optional)</Label>
        <div className="flex gap-2">
          <Input
            id="scrape-url"
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            placeholder="Paste product URL (Amazon, supplier website, etc.)"
            disabled={scraping}
          />
          <Button
            type="button"
            onClick={handleScrapeUrl}
            disabled={!scrapeUrl.trim() || scraping}
            variant="outline"
          >
            {scraping ? "Scraping..." : "Import"}
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="pkg-name">Name</Label>
        <Input
          id="pkg-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Kraft Paper Bag (small)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="pkg-category">Category</Label>
          <Select
            value={form.category}
            onValueChange={(val) =>
              setForm({ ...form, category: val as PackagingCategory })
            }
          >
            <SelectTrigger id="pkg-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {PACKAGING_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pkg-cost">Cost per Unit ($)</Label>
          <Input
            id="pkg-cost"
            type="number"
            step="0.01"
            value={form.costPerUnit}
            onChange={(e) =>
              setForm({ ...form, costPerUnit: e.target.value })
            }
            placeholder="e.g. 0.25"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="pkg-stock">Current Stock</Label>
          <Input
            id="pkg-stock"
            type="number"
            value={form.currentStock}
            onChange={(e) =>
              setForm({ ...form, currentStock: e.target.value })
            }
            placeholder="0"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pkg-threshold">Reorder Threshold</Label>
          <Input
            id="pkg-threshold"
            type="number"
            value={form.reorderThreshold}
            onChange={(e) =>
              setForm({ ...form, reorderThreshold: e.target.value })
            }
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="pkg-supplier">Supplier URL</Label>
        <Input
          id="pkg-supplier"
          value={form.supplierUrl}
          onChange={(e) => setForm({ ...form, supplierUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="pkg-notes">Notes</Label>
        <Textarea
          id="pkg-notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Any additional notes..."
          rows={3}
        />
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Action Bar */}
      <div className="mb-6 flex justify-end">
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Packaging Type
        </Button>
      </div>

      {/* Cards Grid */}
      {packagingTypes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
          <h3 className="font-serif text-xl font-semibold text-text-primary">
            No packaging types yet
          </h3>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            Track your packaging supplies -- bags, boxes, stickers, and more.
          </p>
          <Button onClick={openAdd} className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            Add First Packaging Type
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packagingTypes.map((item) => {
            const lowStock = isLowStock(item);
            return (
              <Card
                key={item.id}
                className={cn(lowStock && "border-warning/50")}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {item.name}
                        {lowStock && (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                      </CardTitle>
                      <div className="mt-1.5 flex items-center gap-2">
                        {item.category && (
                          <Badge variant="secondary">
                            {CATEGORY_LABELS[item.category] ?? item.category}
                          </Badge>
                        )}
                        {lowStock && (
                          <Badge variant="warning">Low Stock</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded-md p-1.5 text-text-secondary transition hover:bg-background hover:text-text-primary"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDelete(item)}
                        className="rounded-md p-1.5 text-text-secondary transition hover:bg-background hover:text-error"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Cost / unit</span>
                      <span className="font-mono text-text-primary">
                        {item.costPerUnit ? `$${item.costPerUnit}` : "--"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Stock</span>
                      <NumberStepper
                        value={item.currentStock ?? 0}
                        onChange={(val) => handleStockUpdate(item, val)}
                        min={0}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">
                        Reorder at
                      </span>
                      <span className="font-mono text-text-secondary">
                        {item.reorderThreshold ?? 0}
                      </span>
                    </div>

                    {item.supplierUrl && (
                      <a
                        href={item.supplierUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Supplier
                      </a>
                    )}

                    {item.notes && (
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Packaging Type</DialogTitle>
            <DialogDescription>
              Add a new packaging supply to track inventory.
            </DialogDescription>
          </DialogHeader>
          {packagingForm}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAdd}
              disabled={!form.name || isPending}
            >
              {isPending ? "Adding..." : "Add Packaging"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Packaging Type</DialogTitle>
            <DialogDescription>
              Update the details for this packaging supply.
            </DialogDescription>
          </DialogHeader>
          {packagingForm}
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
            <DialogTitle>Delete Packaging Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-text-primary">
                {selectedItem?.name}
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
