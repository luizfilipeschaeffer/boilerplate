"use client";

import { AppSidebar } from "@/components/app-sidebar";
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
  user,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  user: { name: string; email: string };
}) {
  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar variant="inset" navItems={navItems} user={user} />
      <SidebarInset>
        <SiteHeaderDynamic />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
