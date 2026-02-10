"use client";

import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createPan, updatePan, deletePan } from "@/lib/actions/pans";
import { calculatePanVolume } from "@/lib/services/scaling-engine";
import { Plus, Pencil, Trash2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type PanShape = "rectangular" | "round" | "square" | "bundt" | "custom";

type Pan = {
  id: number;
  name: string;
  shape: PanShape | null;
  lengthCm: string | null;
  widthCm: string | null;
  diameterCm: string | null;
  heightCm: string | null;
  volumeMl: string | null;
  material: string | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const SHAPES: { value: PanShape; label: string }[] = [
  { value: "rectangular", label: "Rectangular" },
  { value: "round", label: "Round" },
  { value: "square", label: "Square" },
  { value: "bundt", label: "Bundt" },
  { value: "custom", label: "Custom" },
];

const SHAPE_LABELS: Record<string, string> = {
  rectangular: "Rectangular",
  round: "Round",
  square: "Square",
  bundt: "Bundt",
  custom: "Custom",
};

// ─── Form State ──────────────────────────────────────────────────────────────

type FormData = {
  name: string;
  shape: PanShape | "";
  lengthCm: string;
  widthCm: string;
  diameterCm: string;
  heightCm: string;
  volumeMl: string;
  material: string;
  notes: string;
};

const emptyForm: FormData = {
  name: "",
  shape: "",
  lengthCm: "",
  widthCm: "",
  diameterCm: "",
  heightCm: "",
  volumeMl: "",
  material: "",
  notes: "",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function PansClient({ pans }: { pans: Pan[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPan, setSelectedPan] = useState<Pan | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [isPending, startTransition] = useTransition();

  // ─── Volume Calculation ──────────────────────────────────────────────────

  const calculatedVolume = useMemo(() => {
    if (!form.shape) return null;

    if (form.shape === "bundt" || form.shape === "custom") {
      return form.volumeMl ? parseFloat(form.volumeMl) : null;
    }

    const height = parseFloat(form.heightCm);
    if (isNaN(height) || height <= 0) return null;

    if (form.shape === "rectangular") {
      const length = parseFloat(form.lengthCm);
      const width = parseFloat(form.widthCm);
      if (isNaN(length) || isNaN(width)) return null;
      return calculatePanVolume("rectangular", { length, width, height });
    }

    if (form.shape === "round") {
      const diameter = parseFloat(form.diameterCm);
      if (isNaN(diameter)) return null;
      return calculatePanVolume("round", { diameter, height });
    }

    if (form.shape === "square") {
      const length = parseFloat(form.lengthCm);
      if (isNaN(length)) return null;
      return calculatePanVolume("square", { length, height });
    }

    return null;
  }, [form]);

  // ─── Form Helpers ────────────────────────────────────────────────────────

  function openAdd() {
    setForm(emptyForm);
    setAddOpen(true);
  }

  function openEdit(pan: Pan) {
    setSelectedPan(pan);
    setForm({
      name: pan.name,
      shape: (pan.shape ?? "") as PanShape | "",
      lengthCm: pan.lengthCm ?? "",
      widthCm: pan.widthCm ?? "",
      diameterCm: pan.diameterCm ?? "",
      heightCm: pan.heightCm ?? "",
      volumeMl: pan.volumeMl ?? "",
      material: pan.material ?? "",
      notes: pan.notes ?? "",
    });
    setEditOpen(true);
  }

  function openDelete(pan: Pan) {
    setSelectedPan(pan);
    setDeleteOpen(true);
  }

  function getVolumeForSubmit(): string | null {
    if (form.shape === "bundt" || form.shape === "custom") {
      return form.volumeMl || null;
    }
    return calculatedVolume ? String(Math.round(calculatedVolume * 100) / 100) : null;
  }

  function handleSubmitAdd() {
    startTransition(async () => {
      await createPan({
        name: form.name,
        shape: (form.shape || null) as PanShape | null,
        lengthCm: form.lengthCm || null,
        widthCm: form.widthCm || null,
        diameterCm: form.diameterCm || null,
        heightCm: form.heightCm || null,
        volumeMl: getVolumeForSubmit(),
        material: form.material || null,
        notes: form.notes || null,
      });
      setAddOpen(false);
    });
  }

  function handleSubmitEdit() {
    if (!selectedPan) return;
    startTransition(async () => {
      await updatePan(selectedPan.id, {
        name: form.name,
        shape: (form.shape || null) as PanShape | null,
        lengthCm: form.lengthCm || null,
        widthCm: form.widthCm || null,
        diameterCm: form.diameterCm || null,
        heightCm: form.heightCm || null,
        volumeMl: getVolumeForSubmit(),
        material: form.material || null,
        notes: form.notes || null,
      });
      setEditOpen(false);
      setSelectedPan(null);
    });
  }

  function handleDelete() {
    if (!selectedPan) return;
    startTransition(async () => {
      await deletePan(selectedPan.id);
      setDeleteOpen(false);
      setSelectedPan(null);
    });
  }

  // ─── Display Helpers ─────────────────────────────────────────────────────

  function formatDimensions(pan: Pan): string {
    if (!pan.shape) return "--";
    if (pan.shape === "rectangular") {
      return `${pan.lengthCm || "?"} x ${pan.widthCm || "?"} x ${pan.heightCm || "?"} cm`;
    }
    if (pan.shape === "round") {
      return `${pan.diameterCm || "?"} cm dia x ${pan.heightCm || "?"} cm`;
    }
    if (pan.shape === "square") {
      return `${pan.lengthCm || "?"} x ${pan.lengthCm || "?"} x ${pan.heightCm || "?"} cm`;
    }
    return "--";
  }

  // ─── Shared Form ─────────────────────────────────────────────────────────

  const showRectangular = form.shape === "rectangular";
  const showRound = form.shape === "round";
  const showSquare = form.shape === "square";
  const showDirectVolume =
    form.shape === "bundt" || form.shape === "custom";
  const showHeight =
    form.shape === "rectangular" ||
    form.shape === "round" ||
    form.shape === "square";

  const panForm = (
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="pan-name">Name</Label>
          <Input
            id="pan-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. 9x5 Loaf Pan"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pan-shape">Shape</Label>
            <Select
              value={form.shape}
              onValueChange={(val) =>
                setForm({ ...form, shape: val as PanShape })
              }
            >
              <SelectTrigger id="pan-shape">
                <SelectValue placeholder="Select shape" />
              </SelectTrigger>
              <SelectContent>
                {SHAPES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pan-material">Material</Label>
            <Input
              id="pan-material"
              value={form.material}
              onChange={(e) => setForm({ ...form, material: e.target.value })}
              placeholder="e.g. Aluminum, Cast Iron"
            />
          </div>
        </div>

        {/* Conditional dimension inputs */}
        {form.shape && (
          <>
            <Separator />

            {showRectangular && (
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="pan-length">Length (cm)</Label>
                  <Input
                    id="pan-length"
                    type="number"
                    step="0.1"
                    value={form.lengthCm}
                    onChange={(e) =>
                      setForm({ ...form, lengthCm: e.target.value })
                    }
                    placeholder="L"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pan-width">Width (cm)</Label>
                  <Input
                    id="pan-width"
                    type="number"
                    step="0.1"
                    value={form.widthCm}
                    onChange={(e) =>
                      setForm({ ...form, widthCm: e.target.value })
                    }
                    placeholder="W"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pan-height">Height (cm)</Label>
                  <Input
                    id="pan-height"
                    type="number"
                    step="0.1"
                    value={form.heightCm}
                    onChange={(e) =>
                      setForm({ ...form, heightCm: e.target.value })
                    }
                    placeholder="H"
                  />
                </div>
              </div>
            )}

            {showRound && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pan-diameter">Diameter (cm)</Label>
                  <Input
                    id="pan-diameter"
                    type="number"
                    step="0.1"
                    value={form.diameterCm}
                    onChange={(e) =>
                      setForm({ ...form, diameterCm: e.target.value })
                    }
                    placeholder="D"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pan-height-round">Height (cm)</Label>
                  <Input
                    id="pan-height-round"
                    type="number"
                    step="0.1"
                    value={form.heightCm}
                    onChange={(e) =>
                      setForm({ ...form, heightCm: e.target.value })
                    }
                    placeholder="H"
                  />
                </div>
              </div>
            )}

            {showSquare && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pan-side">Side Length (cm)</Label>
                  <Input
                    id="pan-side"
                    type="number"
                    step="0.1"
                    value={form.lengthCm}
                    onChange={(e) =>
                      setForm({ ...form, lengthCm: e.target.value })
                    }
                    placeholder="L"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pan-height-sq">Height (cm)</Label>
                  <Input
                    id="pan-height-sq"
                    type="number"
                    step="0.1"
                    value={form.heightCm}
                    onChange={(e) =>
                      setForm({ ...form, heightCm: e.target.value })
                    }
                    placeholder="H"
                  />
                </div>
              </div>
            )}

            {showDirectVolume && (
              <div className="grid gap-2">
                <Label htmlFor="pan-volume-direct">Volume (mL)</Label>
                <Input
                  id="pan-volume-direct"
                  type="number"
                  step="1"
                  value={form.volumeMl}
                  onChange={(e) =>
                    setForm({ ...form, volumeMl: e.target.value })
                  }
                  placeholder="Enter volume directly"
                />
              </div>
            )}

            {/* Calculated volume display */}
            {calculatedVolume !== null && (
              <div className="rounded-lg bg-background px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                  Calculated Volume
                </p>
                <p className="mt-1 font-mono text-lg text-text-primary">
                  {Math.round(calculatedVolume).toLocaleString()} mL
                </p>
              </div>
            )}
          </>
        )}

        <div className="grid gap-2">
          <Label htmlFor="pan-notes">Notes</Label>
          <Textarea
            id="pan-notes"
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
          Add Pan
        </Button>
      </div>

      {/* Pan Grid */}
      {pans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
          <h3 className="font-serif text-xl font-semibold text-text-primary">
            No pans yet
          </h3>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            Add your baking pans to enable recipe scaling by pan volume.
          </p>
          <Button onClick={openAdd} className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            Add First Pan
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pans.map((pan) => (
            <Card key={pan.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{pan.name}</CardTitle>
                    <div className="mt-1.5 flex items-center gap-2">
                      {pan.shape && (
                        <Badge variant="secondary">
                          {SHAPE_LABELS[pan.shape] ?? pan.shape}
                        </Badge>
                      )}
                      {pan.material && (
                        <Badge variant="secondary">{pan.material}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(pan)}
                      className="rounded-md p-1.5 text-text-secondary transition hover:bg-background hover:text-text-primary"
                      aria-label={`Edit ${pan.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDelete(pan)}
                      className="rounded-md p-1.5 text-text-secondary transition hover:bg-background hover:text-error"
                      aria-label={`Delete ${pan.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Dimensions</span>
                    <span className="text-text-primary">
                      {formatDimensions(pan)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Volume</span>
                    <span className="font-mono text-text-primary">
                      {pan.volumeMl
                        ? `${Math.round(parseFloat(pan.volumeMl)).toLocaleString()} mL`
                        : "--"}
                    </span>
                  </div>
                  {pan.notes && (
                    <p className="mt-2 text-xs text-text-secondary line-clamp-2">
                      {pan.notes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Pan</DialogTitle>
            <DialogDescription>
              Add a baking pan with its dimensions for recipe scaling.
            </DialogDescription>
          </DialogHeader>
          {panForm}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAdd}
              disabled={!form.name || isPending}
            >
              {isPending ? "Adding..." : "Add Pan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pan</DialogTitle>
            <DialogDescription>
              Update the details for this pan.
            </DialogDescription>
          </DialogHeader>
          {panForm}
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
            <DialogTitle>Delete Pan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-text-primary">
                {selectedPan?.name}
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
