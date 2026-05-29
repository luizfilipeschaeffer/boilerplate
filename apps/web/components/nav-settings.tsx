"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronRight,
  CreditCard,
  Layers,
  Settings,
  Users,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

const CONFIG_LINKS = [
  {
    id: "config-home",
    title: "Visão geral",
    url: "/configuracoes",
    icon: <Settings className="size-4" />,
  },
  {
    id: "config-filiais",
    title: "Filiais",
    url: "/configuracoes/filiais",
    icon: <Building2 className="size-4" />,
  },
  {
    id: "config-setores",
    title: "Setores",
    url: "/configuracoes/setores",
    icon: <Layers className="size-4" />,
  },
  {
    id: "config-membros",
    title: "Membros",
    url: "/configuracoes/membros",
    icon: <Users className="size-4" />,
  },
  {
    id: "config-pagamentos",
    title: "Pagamentos",
    url: "/configuracoes/pagamentos",
    icon: <CreditCard className="size-4" />,
  },
  {
    id: "config-conta",
    title: "Conta da plataforma",
    url: "/configuracoes/conta",
    icon: <CreditCard className="size-4" />,
  },
  {
    id: "config-licenca",
    title: "Licença",
    url: "/configuracoes/licenca",
    icon: <CreditCard className="size-4" />,
  },
  {
    id: "config-modulos-plataforma",
    title: "Módulos extras",
    url: "/configuracoes/modulos",
    icon: <Layers className="size-4" />,
  },
  {
    id: "config-suporte",
    title: "Suporte",
    url: "/configuracoes/suporte",
    icon: <Users className="size-4" />,
  },
  {
    id: "config-atualizacoes",
    title: "Atualizações",
    url: "/configuracoes/atualizacoes",
    icon: <Settings className="size-4" />,
  },
  {
    id: "config-dominios",
    title: "Domínios",
    url: "/configuracoes/dominios",
    icon: <Building2 className="size-4" />,
  },
] as const;

function isConfigActive(pathname: string, url: string) {
  if (url === "/configuracoes") return pathname === "/configuracoes";
  return pathname === url || pathname.startsWith(`${url}/`);
}

function isConfigSectionActive(pathname: string) {
  return pathname === "/configuracoes" || pathname.startsWith("/configuracoes/");
}

export function NavSettings() {
  const pathname = usePathname();
  const sectionActive = isConfigSectionActive(pathname);
  const [open, setOpen] = React.useState(sectionActive);

  React.useEffect(() => {
    if (sectionActive) setOpen(true);
  }, [sectionActive]);

  return (
    <SidebarMenu>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger
            render={
              <SidebarMenuButton
                tooltip="Configurações"
                isActive={sectionActive}
                className="w-full"
              />
            }
          >
            <Settings className="size-4" />
            <span className="group-data-[collapsible=icon]:hidden">
              Configurações
            </span>
            <ChevronRight className="ml-auto size-4 transition-transform group-data-[open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {CONFIG_LINKS.map((link) => (
                <SidebarMenuSubItem key={link.id}>
                  <SidebarMenuSubButton
                    isActive={isConfigActive(pathname, link.url)}
                    render={<Link href={link.url} />}
                  >
                    {link.icon}
                    <span>{link.title}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  );
}
