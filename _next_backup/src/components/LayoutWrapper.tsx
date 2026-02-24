"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "./Navigation";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return <>{children}</>;
  }

  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-3xl px-6 py-12 bg-stone-50 text-stone-900 min-h-screen">
        {children}
      </main>
    </>
  );
}
