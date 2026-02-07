"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteRecipe } from "@/lib/actions/recipes";

interface RecipeDetailActionsProps {
  recipeId: number;
  recipeName: string;
}

export function RecipeDetailActions({
  recipeId,
  recipeName,
}: RecipeDetailActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await deleteRecipe(recipeId);
      if (result.success) {
        router.push("/recipes");
      }
    } catch {
      setDeleting(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" asChild>
        <a href={`/recipes/${recipeId}/edit`}>
          <Pencil className="mr-1.5 h-4 w-4" />
          Edit
        </a>
      </Button>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-error hover:bg-error/5">
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{recipeName}&rdquo;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Recipe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
