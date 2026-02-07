import { getPackagingTypes } from "@/lib/actions/packaging";
import { PageHeader } from "@/components/layout/page-header";
import { PackagingClient } from "./packaging-client";

export default async function PackagingPage() {
  const result = await getPackagingTypes();
  const packagingTypes = result.success ? result.data ?? [] : [];

  return (
    <div>
      <PageHeader
        title="Pantry — Packaging"
        description="Track your packaging supplies and inventory levels."
      />
      <PackagingClient packagingTypes={packagingTypes} />
    </div>
  );
}
