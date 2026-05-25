"use client";

import { Suspense } from "react";
import { MarketplaceHeader } from "@/components/marketplace-header";
import { MarketplaceSidebar } from "@/components/marketplace-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const sidebarStyle = {
  "--sidebar-width": "calc(var(--spacing) * 72)",
  "--header-height": "calc(var(--spacing) * 12)",
} as React.CSSProperties;

export function MarketplaceShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider style={sidebarStyle}>
      <Suspense fallback={null}>
        <MarketplaceSidebar variant="inset" />
      </Suspense>
      <SidebarInset>
        <div className="flex min-h-0 flex-1 flex-col">
          <MarketplaceHeader />
          <div className="@container/main flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
