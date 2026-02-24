"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ChefHat,
  ShoppingCart,
  Factory,
  Warehouse,
  Settings,
  Menu,
  X,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Recipes", href: "/recipes", icon: ChefHat },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Order Form", href: "/order-form", icon: ClipboardList },
  {
    label: "Rooted Order Form",
    href: "/rooted-community-order-form",
    icon: ClipboardList,
  },
  { label: "Production", href: "/production", icon: Factory },
  { label: "Pantry", href: "/pantry", icon: Warehouse },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <span className="font-serif text-lg font-semibold text-text-primary">
          MicroBatch
        </span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-background hover:text-text-primary transition"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-surface py-6 transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto"
        )}
      >
        <div className="mb-8 px-6">
          <h1 className="font-serif text-xl font-semibold text-text-primary">
            MicroBatch
          </h1>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition",
                  active
                    ? "bg-background font-medium text-accent"
                    : "text-text-secondary hover:bg-background hover:text-text-primary"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-3 pt-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-text-secondary transition hover:bg-background hover:text-text-primary"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Spacer to push main content on mobile since sidebar is fixed */}
      <div className="h-14 lg:hidden" />
    </>
  );
}
