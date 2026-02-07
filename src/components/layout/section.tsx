import { cn } from "@/lib/utils";

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, children, className }: SectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {title && (
        <h2 className="font-serif text-xl font-semibold text-text-primary">
          {title}
        </h2>
      )}
      <div>{children}</div>
    </section>
  );
}
