"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownUp,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";
import type { NavItem } from "@boilerplate/shared";

import { useSyncContext } from "@/components/sync-provider";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CommandPaletteShortcutsDialog } from "@/components/command-palette-shortcuts-dialog";
import { useCommandPaletteItems } from "@/hooks/use-command-palette-items";
import { ensureModulesRegistered } from "@/lib/modules/init";

ensureModulesRegistered();

const GROUP_ICONS: Record<string, React.ReactNode> = {
  "Ações rápidas": <LayoutDashboard className="size-4 opacity-70" />,
  Navegação: <LayoutDashboard className="size-4 opacity-70" />,
  Catálogo: <Package className="size-4 opacity-70" />,
  Clientes: <Users className="size-4 opacity-70" />,
  Vendas: <ShoppingCart className="size-4 opacity-70" />,
  Estoque: <Warehouse className="size-4 opacity-70" />,
};

function groupIcon(group: string) {
  return GROUP_ICONS[group] ?? <Package className="size-4 opacity-70" />;
}

export function DashboardCommandPalette({
  navItems,
  activeModuleIds,
  role,
  sectorSlug = "geral",
}: {
  navItems: NavItem[];
  activeModuleIds: string[];
  role: string;
  sectorSlug?: string;
}) {
  const router = useRouter();
  const { organizationId } = useSyncContext();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  const { groups, loading, reloadShortcuts } = useCommandPaletteItems({
    open,
    organizationId,
    navItems,
    activeModuleIds,
    role,
    search,
  });

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  function runCommand(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
    <CommandPaletteShortcutsDialog
      open={shortcutsOpen}
      onOpenChange={setShortcutsOpen}
      initialSectorSlug={sectorSlug}
      onSaved={() => reloadShortcuts()}
    />
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Pesquisa rápida"
      description="Navegue, execute ações e busque nos módulos ativos"
      className="sm:max-w-xl"
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Página, ação ou registro (catálogo, clientes, vendas…)"
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {loading && groups.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Carregando dados…
            </div>
          ) : null}
          {groups.length === 0 && !loading ? (
            <CommandEmpty>
              {search.trim()
                ? "Nenhum resultado. Tente outro termo ou sincronize os dados."
                : "Nenhuma ação disponível para o seu perfil."}
            </CommandEmpty>
          ) : (
            groups.map(({ group, items }, index) => (
              <React.Fragment key={group}>
                {index > 0 ? <CommandSeparator /> : null}
                <CommandGroup heading={group}>
                  {items.map((entry) => (
                    <CommandItem
                      key={entry.id}
                      value={entry.keywords}
                      onSelect={() => runCommand(entry.href)}
                    >
                      {entry.id === "action:estoque-movimento" ? (
                        <ArrowDownUp className="size-4 opacity-70" />
                      ) : (
                        groupIcon(group)
                      )}
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{entry.label}</span>
                        {entry.description ? (
                          <span className="truncate text-xs font-normal text-muted-foreground">
                            {entry.description}
                          </span>
                        ) : null}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </React.Fragment>
            ))
          )}
        </CommandList>
        <div className="flex items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
          <span className="min-w-0 truncate">Busca nos módulos ativos (cache local)</span>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setShortcutsOpen(true);
              }}
            >
              Editar atalhos
            </Button>
            <CommandShortcut>Alt+P</CommandShortcut>
          </div>
        </div>
      </Command>
    </CommandDialog>
    </>
  );
}
