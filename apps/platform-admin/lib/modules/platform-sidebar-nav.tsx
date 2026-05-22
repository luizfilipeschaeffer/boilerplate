import type { PlatformModuleId } from "@/lib/rbac";
import type { PlatformRole } from "@boilerplate/db";
import type { ReactNode } from "react";
import {
  Activity,
  Boxes,
  CreditCard,
  List,
  Package,
} from "lucide-react";

import { canAccessPlatformModule } from "@/lib/rbac";
import {
  ALL_PLATFORM_NAV,
  type PlatformNavItem,
} from "@/lib/modules/platform-nav";

export type PlatformSidebarNavLink = {
  type: "link";
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  moduleId: PlatformModuleId;
};

export type PlatformSidebarNavGroup = {
  type: "group";
  id: string;
  label: string;
  icon?: ReactNode;
  moduleId: PlatformModuleId;
  items: PlatformSidebarNavLink[];
};

export type PlatformSidebarNavEntry =
  | PlatformSidebarNavLink
  | PlatformSidebarNavGroup;

export const MODULOS_SUB_NAV: Omit<
  PlatformSidebarNavLink,
  "type" | "moduleId"
>[] = [
  {
    id: "modulos-catalogo",
    label: "Catálogo",
    href: "/modulos/catalogo",
    icon: <List className="size-4" />,
  },
  {
    id: "modulos-planos",
    label: "Planos base",
    href: "/modulos/planos",
    icon: <CreditCard className="size-4" />,
  },
  {
    id: "modulos-bundles",
    label: "Bundles",
    href: "/modulos/bundles",
    icon: <Boxes className="size-4" />,
  },
  {
    id: "modulos-ativacoes",
    label: "Ativações",
    href: "/modulos/ativacoes",
    icon: <Activity className="size-4" />,
  },
];

function navItemToLink(item: PlatformNavItem): PlatformSidebarNavLink {
  return {
    type: "link",
    id: item.id,
    label: item.label,
    href: item.href,
    icon: item.icon,
    moduleId: item.id,
  };
}

export function buildPlatformSidebarNav(
  role: PlatformRole,
): PlatformSidebarNavEntry[] {
  const items = ALL_PLATFORM_NAV.filter((item) =>
    canAccessPlatformModule(role, item.id),
  );

  return items.map((item) => {
    if (item.id !== "platform-modulos") {
      return navItemToLink(item);
    }

    return {
      type: "group",
      id: item.id,
      label: item.label,
      icon: item.icon ?? <Package className="size-4" />,
      moduleId: item.id,
      items: MODULOS_SUB_NAV.map((sub) => ({
        type: "link" as const,
        ...sub,
        moduleId: item.id,
      })),
    };
  });
}
