"use client";

import { SetHeaderInfo } from "@/components/header-actions-context";
import { StockPanel } from "@/components/stock-panel";
import { useCachedStore } from "@/hooks/use-cached-store";
import { buildStockFromCatalog, getLowStockIds } from "@/lib/idb/sync-service";
import type { CachedCatalogItem } from "@/lib/idb/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import * as React from "react";
import { CACHE_UPDATED_EVENT } from "@/lib/idb/types";

export function EstoqueCachedView() {
  const { data: catalog, loading } = useCachedStore<CachedCatalogItem>("catalog");
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener(CACHE_UPDATED_EVENT, h);
    return () => window.removeEventListener(CACHE_UPDATED_EVENT, h);
  }, []);

  const { products, lowCount } = React.useMemo(
    () => buildStockFromCatalog(catalog, getLowStockIds()),
    [catalog],
  );

  const headerInfo = React.useMemo(() => {
    const base = "Entrada, saída e alerta de estoque baixo.";
    if (lowCount > 0) {
      return `${base} ${lowCount} item(ns) abaixo do mínimo no momento.`;
    }
    return base;
  }, [lowCount]);

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <SetHeaderInfo>{headerInfo}</SetHeaderInfo>
      <Card>
        <CardHeader>
          <CardTitle>Movimentação</CardTitle>
          <CardDescription>Cache sincronizado com o catálogo</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && products.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Carregando cache…
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Cadastre produtos no catálogo para controlar estoque.
            </p>
          ) : (
            <StockPanel products={products} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
