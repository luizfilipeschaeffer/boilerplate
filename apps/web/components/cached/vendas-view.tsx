"use client";

import * as React from "react";
import { OfflineSyncBanner } from "@/components/offline-sync-banner";
import { SalesDataTable, type SaleRow } from "@/components/sales-data-table";
import {
  VendasHeaderToolbar,
  type SalesFormData,
} from "@/components/vendas-header-toolbar";
import { getSaleFormDataAction } from "@/app/actions/sales";
import { useCachedStore } from "@/hooks/use-cached-store";
import type { CachedCatalogItem, CachedClient, CachedSale } from "@/lib/idb/types";
import { Spinner } from "@/components/ui/spinner";

export function VendasCachedView() {
  const { data: sales, loading: loadingSales } =
    useCachedStore<CachedSale>("sales");
  const { data: clients } = useCachedStore<CachedClient>("clients");
  const { data: catalog } = useCachedStore<CachedCatalogItem>("catalog");
  const [sellers, setSellers] = React.useState<
    { id: string; name: string }[]
  >([]);

  React.useEffect(() => {
    void getSaleFormDataAction().then((d) => setSellers(d.sellers ?? []));
  }, []);

  const formData = React.useMemo<SalesFormData>(
    () => ({
      clients: clients
        .filter((c) => c.active ?? true)
        .map((c) => ({ id: c.id, name: c.name })),
      sellers,
      items: catalog
        .filter((i) => i.active ?? true)
        .map((i) => ({
          id: i.id,
          name: i.name,
          priceCents: i.priceCents,
          itemType: i.itemType,
          stockQty: i.stockQty,
        })),
    }),
    [clients, catalog, sellers],
  );

  const saleRows: SaleRow[] = React.useMemo(
    () =>
      [...sales]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .map((s) => ({
          id: s.id,
          clientName: s.clientName,
          paymentMethod: s.paymentMethod,
          totalCents: s.totalCents,
          createdAt: new Date(s.createdAt),
          items: s.items.map((it) => ({
            itemName: it.itemName,
            quantity: it.quantity,
          })),
        })),
    [sales],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-8 lg:px-6">
      <VendasHeaderToolbar formData={formData} />
      <OfflineSyncBanner />
      {loadingSales ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-5" />
          Carregando vendas…
        </div>
      ) : (
        <SalesDataTable sales={saleRows} />
      )}
    </div>
  );
}
