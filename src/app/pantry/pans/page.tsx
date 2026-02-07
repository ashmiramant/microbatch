import { getPans } from "@/lib/actions/pans";
import { PageHeader } from "@/components/layout/page-header";
import { PansClient } from "./pans-client";

export default async function PansPage() {
  const result = await getPans();
  const pans = result.success ? result.data ?? [] : [];

  return (
    <div>
      <PageHeader
        title="Pantry — Pans"
        description="Manage your baking pans for volume-based recipe scaling."
      />
      <PansClient pans={pans} />
    </div>
  );
}
