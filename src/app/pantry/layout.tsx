"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const pantryTabs = [
  { label: "Ingredients", href: "/pantry" },
  { label: "Packaging", href: "/pantry/packaging" },
  { label: "Pans", href: "/pantry/pans" },
];

export default function PantryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/pantry") return pathname === "/pantry";
    return pathname.startsWith(href);
  };

  return (
    <div>
      <nav className="mb-8 flex gap-1 rounded-lg bg-background p-1">
        {pantryTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all",
              isActive(tab.href)
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
