"use client";

import { CatalogoHeaderToolbar } from "@/components/catalogo-header-toolbar";
import {
  CatalogDataTable,
  type CatalogRow,
} from "@/components/catalog-data-table";
import { useCachedStore } from "@/hooks/use-cached-store";
import type { CachedCatalogItem } from "@/lib/idb/types";
import { Spinner } from "@/components/ui/spinner";

export function CatalogoCachedView() {
  const { data, loading } = useCachedStore<CachedCatalogItem>("catalog");

  const items: CatalogRow[] = data.map((row) => ({
    id: row.id,
    name: row.name,
    itemType: row.itemType,
    sku: row.sku,
    priceCents: row.priceCents,
    stockQty: row.stockQty,
    active: row.active ?? true,
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-8 lg:px-6">
      <CatalogoHeaderToolbar />
      {loading ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-5" />
          Carregando catálogo…
        </div>
      ) : (
        <CatalogDataTable items={items} />
      )}
    </div>
  );
}
