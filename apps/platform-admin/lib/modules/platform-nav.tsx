import type { PlatformModuleId } from "@/lib/rbac";
import type { PlatformRole } from "@boilerplate/db";
import { canAccessPlatformModule } from "@/lib/rbac";
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  MessageSquare,
  Layers,
  Package,
  Store,
  Users,
  Plug,
  Wallet,
} from "lucide-react";

export type PlatformNavItem = {
  id: PlatformModuleId;
  label: string;
  href: string;
  ordem: number;
  icon: React.ReactNode;
};

export const ALL_PLATFORM_NAV: PlatformNavItem[] = [
  {
    id: "dashboard",
    label: "Início",
    href: "/dashboard",
    ordem: 10,
    icon: <LayoutDashboard className="size-4" />,
  },
  {
    id: "platform-crm",
    label: "CRM",
    href: "/crm",
    ordem: 20,
    icon: <Users className="size-4" />,
  },
  {
    id: "platform-comms",
    label: "Comunicação",
    href: "/comms",
    ordem: 30,
    icon: <MessageSquare className="size-4" />,
  },
  {
    id: "platform-insights",
    label: "Insights",
    href: "/insights",
    ordem: 40,
    icon: <BarChart3 className="size-4" />,
  },
  {
    id: "platform-modulos",
    label: "Módulos",
    href: "/modulos",
    ordem: 45,
    icon: <Package className="size-4" />,
  },
  {
    id: "platform-segmentos",
    label: "Segmentos",
    href: "/segmentos",
    ordem: 46,
    icon: <Store className="size-4" />,
  },
  {
    id: "platform-integradores",
    label: "Integradores",
    href: "/integradores",
    ordem: 48,
    icon: <Plug className="size-4" />,
  },
  {
    id: "platform-roadmap",
    label: "Roadmap",
    href: "/roadmap",
    ordem: 47,
    icon: <Layers className="size-4" />,
  },
  {
    id: "organizacoes",
    label: "Organizações",
    href: "/organizacoes",
    ordem: 50,
    icon: <Building2 className="size-4" />,
  },
];

export function getPlatformNavForRole(role: PlatformRole): PlatformNavItem[] {
  return ALL_PLATFORM_NAV.filter((item) =>
    canAccessPlatformModule(role, item.id),
  );
}
