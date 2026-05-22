"use client";

import * as React from "react";

import { getCommandPaletteShortcutsAction } from "@/app/actions/command-palette-shortcuts";
import {
  buildDataSearchItems,
  buildNavigationItems,
  buildShortcutActionItems,
} from "@/lib/command-palette/build-items";
import type { CommandPaletteItem } from "@/lib/command-palette/types";
import { getAllFromStore } from "@/lib/idb/database";
import type {
  CachedCatalogItem,
  CachedClient,
  CachedSale,
} from "@/lib/idb/types";
import { CACHE_UPDATED_EVENT } from "@/lib/idb/types";
import type { NavItem } from "@boilerplate/shared";

type CachedData = {
  catalog: CachedCatalogItem[];
  clients: CachedClient[];
  sales: CachedSale[];
};

export function useCommandPaletteItems({
  open,
  organizationId,
  navItems,
  activeModuleIds,
  role,
  search,
}: {
  open: boolean;
  organizationId: string;
  navItems: NavItem[];
  activeModuleIds: string[];
  role: string;
  search: string;
}) {
  const [cached, setCached] = React.useState<CachedData | null>(null);
  const [shortcutIds, setShortcutIds] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const loadCache = React.useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [catalog, clients, sales] = await Promise.all([
        getAllFromStore<CachedCatalogItem>(organizationId, "catalog"),
        getAllFromStore<CachedClient>(organizationId, "clients"),
        getAllFromStore<CachedSale>(organizationId, "sales"),
      ]);
      setCached({ catalog, clients, sales });
    } catch {
      setCached({ catalog: [], clients: [], sales: [] });
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const loadShortcuts = React.useCallback(async () => {
    try {
      const layout = await getCommandPaletteShortcutsAction();
      setShortcutIds(layout.effectiveShortcuts);
    } catch {
      setShortcutIds([]);
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    void loadCache();
    void loadShortcuts();
  }, [open, loadCache, loadShortcuts]);

  React.useEffect(() => {
    if (!open) return;
    const onCache = () => void loadCache();
    window.addEventListener(CACHE_UPDATED_EVENT, onCache);
    return () => window.removeEventListener(CACHE_UPDATED_EVENT, onCache);
  }, [open, loadCache]);

  const staticItems = React.useMemo(
    () => [
      ...buildShortcutActionItems(
        shortcutIds,
        navItems,
        activeModuleIds,
        role,
      ),
      ...buildNavigationItems(navItems, activeModuleIds, role),
    ],
    [shortcutIds, activeModuleIds, navItems, role],
  );

  const filteredStatic = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staticItems;
    return staticItems.filter((i) => i.keywords.toLowerCase().includes(q));
  }, [staticItems, search]);

  const dataItems = React.useMemo(() => {
    if (!cached || !search.trim()) return [];
    return buildDataSearchItems(activeModuleIds, search, cached);
  }, [activeModuleIds, cached, search]);

  const groups = React.useMemo(() => {
    const all = [...filteredStatic, ...dataItems];
    const order = [
      "Ações rápidas",
      "Navegação",
      "Catálogo",
      "Clientes",
      "Vendas",
      "Estoque",
    ];
    const map = new Map<string, CommandPaletteItem[]>();
    for (const entry of all) {
      const list = map.get(entry.group) ?? [];
      list.push(entry);
      map.set(entry.group, list);
    }
    return order
      .filter((g) => map.has(g))
      .map((g) => ({ group: g, items: map.get(g)! }));
  }, [filteredStatic, dataItems]);

  return {
    groups,
    loading,
    hasCache: cached !== null,
    reloadShortcuts: loadShortcuts,
  };
}
