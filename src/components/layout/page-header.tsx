import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex items-start justify-between", className)}>
      <div>
        <h1 className="font-serif text-3xl font-semibold text-text-primary">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-text-secondary">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
