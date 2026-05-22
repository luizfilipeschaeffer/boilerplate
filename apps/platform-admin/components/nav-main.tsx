"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  PlatformSidebarNavEntry,
  PlatformSidebarNavGroup,
} from "@/lib/modules/platform-sidebar-nav";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

function isNavItemActive(pathname: string, url: string) {
  if (url === "/dashboard") return pathname === "/dashboard";
  return pathname === url || pathname.startsWith(`${url}/`);
}

function isGroupActive(
  pathname: string,
  group: PlatformSidebarNavGroup,
) {
  return group.items.some((item) => isNavItemActive(pathname, item.href));
}

function NavMainGroup({
  entry,
  pathname,
}: {
  entry: PlatformSidebarNavGroup;
  pathname: string;
}) {
  const groupActive = isGroupActive(pathname, entry);
  const [open, setOpen] = React.useState(groupActive);

  React.useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger
          render={
            <SidebarMenuButton
              tooltip={entry.label}
              isActive={groupActive}
              className="w-full"
            />
          }
        >
          {entry.icon}
          <span className="group-data-[collapsible=icon]:hidden">
            {entry.label}
          </span>
          <ChevronRight className="ml-auto size-4 transition-transform group-data-[open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {entry.items.map((sub) => (
              <SidebarMenuSubItem key={sub.id}>
                <SidebarMenuSubButton
                  isActive={isNavItemActive(pathname, sub.href)}
                  render={<Link href={sub.href} />}
                >
                  {sub.icon}
                  <span>{sub.label}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function NavMain({ entries }: { entries: PlatformSidebarNavEntry[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Painel da plataforma</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {entries.map((entry) => {
            if (entry.type === "link") {
              return (
                <SidebarMenuItem key={entry.id}>
                  <SidebarMenuButton
                    tooltip={entry.label}
                    isActive={isNavItemActive(pathname, entry.href)}
                    render={<Link href={entry.href} />}
                  >
                    {entry.icon}
                    <span className="group-data-[collapsible=icon]:hidden">
                      {entry.label}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            return (
              <NavMainGroup key={entry.id} entry={entry} pathname={pathname} />
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
