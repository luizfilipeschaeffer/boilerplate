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
import type { SidebarNavEntry } from "@/lib/modules/sidebar-nav";

function isNavItemActive(pathname: string, url: string) {
  if (url === "/dashboard") return pathname === "/dashboard";
  return pathname === url || pathname.startsWith(`${url}/`);
}

function isGroupActive(pathname: string, group: Extract<SidebarNavEntry, { type: "group" }>) {
  if (group.url && isNavItemActive(pathname, group.url)) return true;
  return group.items.some((item) => isNavItemActive(pathname, item.url));
}

type NavGroupEntry = Extract<SidebarNavEntry, { type: "group" }>;

function NavMainGroup({
  entry,
  pathname,
}: {
  entry: NavGroupEntry;
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
              tooltip={entry.title}
              isActive={groupActive}
              className="w-full"
            />
          }
        >
          {entry.icon}
          <span className="group-data-[collapsible=icon]:hidden">
            {entry.title}
          </span>
          <ChevronRight className="ml-auto size-4 transition-transform group-data-[open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {entry.url ? (
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  isActive={isNavItemActive(pathname, entry.url)}
                  render={<Link href={entry.url} />}
                >
                  Visão geral
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ) : null}
            {entry.items.map((sub) => (
              <SidebarMenuSubItem key={sub.id}>
                <SidebarMenuSubButton
                  isActive={isNavItemActive(pathname, sub.url)}
                  render={<Link href={sub.url} />}
                >
                  {sub.icon}
                  <span>{sub.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function NavMain({ entries }: { entries: SidebarNavEntry[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Módulos</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {entries.map((entry) => {
            if (entry.type === "link") {
              return (
                <SidebarMenuItem key={entry.id}>
                  <SidebarMenuButton
                    tooltip={entry.title}
                    isActive={isNavItemActive(pathname, entry.url)}
                    render={<Link href={entry.url} />}
                  >
                    {entry.icon}
                    <span className="group-data-[collapsible=icon]:hidden">
                      {entry.title}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            return (
              <NavMainGroup key={entry.title} entry={entry} pathname={pathname} />
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
