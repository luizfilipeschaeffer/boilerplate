"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeaderDynamic } from "@/components/site-header-dynamic";
import type { PlatformNavItem } from "@/lib/modules/platform-nav";
import type { PlatformRole } from "@boilerplate/db";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const sidebarStyle = {
  "--sidebar-width": "calc(var(--spacing) * 72)",
  "--header-height": "calc(var(--spacing) * 12)",
} as React.CSSProperties;

export function PlatformShell({
  children,
  navItems,
  user,
}: {
  children: React.ReactNode;
  navItems: PlatformNavItem[];
  user: { name: string; email: string; platformRole: PlatformRole };
}) {
  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar variant="inset" navItems={navItems} user={user} />
      <SidebarInset>
        <SiteHeaderDynamic />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
