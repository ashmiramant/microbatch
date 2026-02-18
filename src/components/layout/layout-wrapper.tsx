"use client";

import { usePathname } from "next/navigation";
import { SidebarNav } from "./sidebar-nav";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Pages that don't need the sidebar
  const noSidebarPages = ["/login", "/order-form", "/orders/print"];
  const showSidebar = !noSidebarPages.some(page => pathname.startsWith(page));

  if (showSidebar) {
    return (
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 px-6 py-8 lg:px-12">
          {children}
        </main>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {children}
    </main>
  );
}
