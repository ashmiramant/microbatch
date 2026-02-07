import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BatchStatusBadge } from "@/components/production/batch-status-badge";
import { formatDateTime } from "@/lib/utils/date";

interface RunCardProps {
  run: {
    id: number;
    name: string;
    status: string;
    targetCompletionAt: Date | null;
    batchCount?: number;
  };
}

export function RunCard({ run }: RunCardProps) {
  return (
    <Link href={`/production/${run.id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2">{run.name}</CardTitle>
            <BatchStatusBadge status={run.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {run.targetCompletionAt && (
              <p className="text-sm text-text-secondary">
                Due: {formatDateTime(run.targetCompletionAt)}
              </p>
            )}
            {run.batchCount !== undefined && (
              <p className="text-sm text-text-secondary">
                {run.batchCount} batch{run.batchCount !== 1 ? "es" : ""}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
