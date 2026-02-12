"use client";

import { Button } from "@/components/ui/button";

export function PrintControls() {
  return (
    <div className="print-controls mb-4 flex items-center justify-end gap-2">
      <Button variant="outline" onClick={() => window.close()}>
        Close
      </Button>
      <Button onClick={() => window.print()}>Print</Button>
    </div>
  );
}
