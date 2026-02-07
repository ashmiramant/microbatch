import { Badge } from "@/components/ui/badge";

const statusMap: Record<
  string,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }
> = {
  // Production run statuses
  draft: { label: "Draft", variant: "secondary" },
  scheduled: { label: "Scheduled", variant: "default" },
  in_progress: { label: "In Progress", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  // Batch statuses
  pending: { label: "Pending", variant: "secondary" },
};

interface BatchStatusBadgeProps {
  status: string;
  className?: string;
}

export function BatchStatusBadge({ status, className }: BatchStatusBadgeProps) {
  const config = statusMap[status] ?? {
    label: status.replace(/_/g, " "),
    variant: "secondary" as const,
  };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
