import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  await requireAuth();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your MicroBatch preferences."
      />
      <SettingsClient />
    </div>
  );
}
