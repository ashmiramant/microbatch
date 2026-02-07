import { getIngredients } from "@/lib/actions/ingredients";
import { PageHeader } from "@/components/layout/page-header";
import { IngredientsClient } from "./ingredients-client";

export default async function PantryIngredientsPage() {
  const result = await getIngredients();
  const ingredients = result.success ? result.data ?? [] : [];

  return (
    <div>
      <PageHeader
        title="Pantry — Ingredients"
        description="Your ingredient library for recipe building and cost tracking."
      />
      <IngredientsClient ingredients={ingredients} />
    </div>
  );
}
