"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActionsProvider } from "@/components/header-actions-context";
import { SiteHeaderDynamic } from "@/components/site-header-dynamic";
import type { PlatformSidebarNavEntry } from "@/lib/modules/platform-sidebar-nav";
import type { PlatformRole } from "@boilerplate/db";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const sidebarStyle = {
  "--sidebar-width": "calc(var(--spacing) * 72)",
  "--header-height": "calc(var(--spacing) * 12)",
} as React.CSSProperties;

export function PlatformShell({
  children,
  navEntries,
  user,
}: {
  children: React.ReactNode;
  navEntries: PlatformSidebarNavEntry[];
  user: { name: string; email: string; platformRole: PlatformRole };
}) {
  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar variant="inset" navEntries={navEntries} user={user} />
      <SidebarInset>
        <HeaderActionsProvider>
          <SiteHeaderDynamic />
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="@container/main flex min-h-0 flex-1 flex-col gap-2">
              <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
                {children}
              </div>
            </div>
          </div>
        </HeaderActionsProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
