"use client";

import { CatalogoHeaderToolbar } from "@/components/catalogo-header-toolbar";
import {
  CatalogDataTable,
  type CatalogRow,
} from "@/components/catalog-data-table";
import { useCachedStore } from "@/hooks/use-cached-store";
import type { CachedCatalogItem } from "@/lib/idb/types";
import { Spinner } from "@/components/ui/spinner";
import type { SegmentCatalogHint } from "@/lib/catalog-segment";

export function CatalogoCachedView({
  segmentHints = [],
}: {
  segmentHints?: SegmentCatalogHint[];
}) {
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
      {segmentHints.length > 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium">Campos sugeridos por segmento</p>
          <ul className="mt-2 space-y-2 text-muted-foreground">
            {segmentHints.map((h) => (
              <li key={h.moduleId}>
                <span className="text-foreground">{h.label}:</span>{" "}
                {h.fields.map((f) => f.label).join(", ")} — use SKU/notas no
                cadastro até campos dedicados.
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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
