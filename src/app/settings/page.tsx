import { PageHeader } from "@/components/layout/page-header";
import { SettingsClient } from "./settings-client";

export default function SettingsPage() {
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
