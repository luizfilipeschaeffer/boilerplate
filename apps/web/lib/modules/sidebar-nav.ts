import type { NavItem } from "@boilerplate/shared";
import type { ReactNode } from "react";

export type SidebarNavLink = {
  type: "link";
  title: string;
  url: string;
  /** Identificador estável (ex.: module id) — evita keys duplicadas quando url coincide */
  id: string;
  icon?: ReactNode;
};

export type SidebarNavGroup = {
  type: "group";
  title: string;
  /** Hub do grupo (ex.: fiscal-core) */
  url?: string;
  icon?: ReactNode;
  items: SidebarNavLink[];
};

export type SidebarNavEntry = SidebarNavLink | SidebarNavGroup;

function moduleIdFromNavItem(item: NavItem): string {
  return item.id.replace(/-nav$/, "");
}

function isFiscalChildModuleId(id: string): boolean {
  return id.startsWith("fiscal-") && id !== "fiscal-core";
}

/**
 * Separa itens fiscais (NFC-e, NF-e, etc.) em um grupo "Fiscal" com submenus.
 */
export function buildSidebarNavEntries(
  navItems: NavItem[],
  options: {
    home?: SidebarNavLink;
    mapIcon: (moduleId: string) => ReactNode;
  },
): SidebarNavEntry[] {
  const fiscalChildren: SidebarNavLink[] = [];
  const topLevel: SidebarNavLink[] = [];
  const topLevelUrls = new Set<string>();

  for (const item of navItems) {
    if (item.href === "/dashboard") continue;

    const moduleId = moduleIdFromNavItem(item);
    const link: SidebarNavLink = {
      type: "link",
      id: moduleId,
      title: item.label,
      url: item.href,
      icon: options.mapIcon(moduleId),
    };

    if (isFiscalChildModuleId(moduleId)) {
      fiscalChildren.push(link);
    } else if (moduleId !== "fiscal-core") {
      if (topLevelUrls.has(item.href)) continue;
      topLevelUrls.add(item.href);
      topLevel.push(link);
    }
  }

  topLevel.sort(
    (a, b) =>
      (navItems.find((n) => moduleIdFromNavItem(n) === a.id)?.ordem ?? 0) -
      (navItems.find((n) => moduleIdFromNavItem(n) === b.id)?.ordem ?? 0),
  );

  const fiscalChildUrls = new Set<string>();
  const dedupedFiscalChildren = fiscalChildren.filter((link) => {
    if (fiscalChildUrls.has(link.url)) return false;
    fiscalChildUrls.add(link.url);
    return true;
  });

  dedupedFiscalChildren.sort(
    (a, b) =>
      (navItems.find((n) => moduleIdFromNavItem(n) === a.id)?.ordem ?? 0) -
      (navItems.find((n) => moduleIdFromNavItem(n) === b.id)?.ordem ?? 0),
  );

  const entries: SidebarNavEntry[] = [];

  if (options.home) {
    entries.push(options.home);
  }

  entries.push(...topLevel);

  if (fiscalChildren.length > 0) {
    const fiscalCore = navItems.find(
      (n) => moduleIdFromNavItem(n) === "fiscal-core",
    );
    entries.push({
      type: "group",
      title: fiscalCore?.label ?? "Fiscal",
      url: fiscalCore?.href ?? "/fiscal-core",
      icon: options.mapIcon("fiscal-core"),
      items: dedupedFiscalChildren,
    });
  }

  return entries;
}
