import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import "@/styles/globals.css";
import { SidebarNav } from "@/components/layout/sidebar-nav";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "MicroBatch",
  description: "Micro-bakery production management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen">
          <SidebarNav />
          <main className="flex-1 px-6 py-8 lg:px-12">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
