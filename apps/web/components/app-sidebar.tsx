"use client";

import type { NavItem } from "@boilerplate/shared";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Warehouse,
  BarChart3,
  Wallet,
  UserCircle,
  LineChart,
  Shirt,
  UtensilsCrossed,
  FileText,
  Bot,
  Receipt,
  Truck,
  FileSpreadsheet,
  Wheat,
  Calculator,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { buildSidebarNavEntries } from "@/lib/modules/sidebar-nav";

const iconByModule: Record<string, React.ReactNode> = {
  "core-catalogo": <Package className="size-4" />,
  "core-clientes": <Users className="size-4" />,
  "core-crm": <Users className="size-4" />,
  "core-vendas": <ShoppingCart className="size-4" />,
  "core-estoque-basico": <Warehouse className="size-4" />,
  "core-ranking": <BarChart3 className="size-4" />,
  "fin-fluxo-caixa": <Wallet className="size-4" />,
  "ops-vendedores": <UserCircle className="size-4" />,
  "rel-basico": <LineChart className="size-4" />,
  "segment-moda": <Shirt className="size-4" />,
  "segment-alimentacao": <UtensilsCrossed className="size-4" />,
  "fiscal-core": <FileText className="size-4" />,
  "fiscal-nfce": <Receipt className="size-4" />,
  "fiscal-nfe": <FileText className="size-4" />,
  "fiscal-cte": <Truck className="size-4" />,
  "fiscal-mdfe": <Truck className="size-4" />,
  "fiscal-ciot": <FileSpreadsheet className="size-4" />,
  "fiscal-sped": <FileSpreadsheet className="size-4" />,
  "fiscal-rural": <Wheat className="size-4" />,
  "fiscal-contabil": <Calculator className="size-4" />,
  aprendiz: <Bot className="size-4" />,
};

function moduleIcon(id: string) {
  if (iconByModule[id]) return iconByModule[id];
  if (id.startsWith("fiscal-"))
    return <FileText className="size-4" />;
  return <Package className="size-4" />;
}

export function AppSidebar({
  navItems,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  navItems: NavItem[];
  user: { name: string; email: string };
}) {
  const entries = buildSidebarNavEntries(navItems, {
    home: {
      type: "link",
      title: "Início",
      url: "/dashboard",
      icon: <LayoutDashboard className="size-4" />,
    },
    mapIcon: moduleIcon,
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <LayoutDashboard className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">Boilerplate</span>
                <span className="truncate text-xs text-muted-foreground">
                  Plataforma modular
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain entries={entries} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
