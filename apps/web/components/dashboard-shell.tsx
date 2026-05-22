"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardCommandPalette } from "@/components/dashboard-command-palette";
import { DebugBar, DebugBarSpacer } from "@/components/debug-bar";
import { DebugModeProvider } from "@/components/debug-mode-provider";
import { InactivityLogoutGuard } from "@/components/inactivity-logout-guard";
import { HeaderActionsProvider } from "@/components/header-actions-context";
import { SiteHeaderDynamic } from "@/components/site-header-dynamic";
import type { NavItem } from "@boilerplate/shared";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const sidebarStyle = {
  "--sidebar-width": "calc(var(--spacing) * 72)",
  "--header-height": "calc(var(--spacing) * 12)",
} as React.CSSProperties;

export function DashboardShell({
  children,
  navItems,
  activeModuleIds,
  user,
  role = "dono",
  branchId,
  sectorId = "geral",
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  activeModuleIds: string[];
  user: { name: string; email: string };
  role?: string;
  branchId?: string | null;
  sectorId?: string;
}) {
  return (
    <DebugModeProvider>
      <InactivityLogoutGuard />
      <DashboardCommandPalette
        navItems={navItems}
        activeModuleIds={activeModuleIds}
        role={role}
        sectorSlug={sectorId}
      />
      <SidebarProvider style={sidebarStyle}>
        <AppSidebar
          variant="inset"
          navItems={navItems}
          user={user}
          role={role}
          branchId={branchId}
          sectorId={sectorId}
        />
        <SidebarInset>
          <HeaderActionsProvider>
            <div className="flex min-h-0 flex-1 flex-col">
              <SiteHeaderDynamic />
              <div className="flex min-h-0 flex-1 flex-col pt-6 md:pt-8">
                <div className="@container/main flex min-h-0 flex-1 flex-col gap-2">
                  {children}
                </div>
                <DebugBarSpacer />
              </div>
            </div>
          </HeaderActionsProvider>
        </SidebarInset>
        <DebugBar />
      </SidebarProvider>
    </DebugModeProvider>
  );
}
