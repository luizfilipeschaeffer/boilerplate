"use client";

import Link from "next/link";
import * as React from "react";

import {
  listStockProductsPageAction,
  saveStockMinsAction,
  type StockProductRow,
} from "@/app/actions/stock";
import { EstoqueProdutosHeaderToolbar } from "@/components/estoque-produtos-header-toolbar";
import { SetHeaderInfo } from "@/components/header-actions-context";
import { useSyncContext } from "@/components/sync-provider";
import {
  countDirtyStockMins,
  isStockMinDirty,
  parseStockMinValue,
  StockProductsDataTable,
} from "@/components/stock-products-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CACHE_UPDATED_EVENT } from "@/lib/idb/types";

export function EstoqueProdutosView({
  initialProducts,
  initialCatalogItemCount,
  initialLowCount,
  canEdit,
}: {
  initialProducts: StockProductRow[];
  initialCatalogItemCount: number;
  initialLowCount: number;
  canEdit: boolean;
}) {
  const { requestSync } = useSyncContext();
  const [products, setProducts] = React.useState(initialProducts);
  const [draftMins, setDraftMins] = React.useState<Record<string, string>>({});
  const [catalogItemCount, setCatalogItemCount] = React.useState(
    initialCatalogItemCount,
  );
  const [lowCount, setLowCount] = React.useState(initialLowCount);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const pendingCount = React.useMemo(
    () => countDirtyStockMins(products, draftMins),
    [products, draftMins],
  );

  const refresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await listStockProductsPageAction();
      setProducts(data.products);
      setCatalogItemCount(data.catalogItemCount);
      setLowCount(data.lowCount);
      setDraftMins((prev) => {
        const next = { ...prev };
        for (const p of data.products) {
          if (next[p.id] !== undefined && !isStockMinDirty(p, next)) {
            delete next[p.id];
          }
        }
        return next;
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    const onCache = () => void refresh();
    window.addEventListener(CACHE_UPDATED_EVENT, onCache);
    return () => window.removeEventListener(CACHE_UPDATED_EVENT, onCache);
  }, [refresh]);

  const handleDraftMinChange = React.useCallback(
    (productId: string, value: string) => {
      setDraftMins((prev) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return { ...prev, [productId]: value };
        const parsed = parseStockMinValue(value);
        if (parsed === product.stockMin) {
          const next = { ...prev };
          delete next[productId];
          return next;
        }
        return { ...prev, [productId]: value };
      });
    },
    [products],
  );

  const savePending = React.useCallback(async () => {
    const changes = products
      .filter((p) => isStockMinDirty(p, draftMins))
      .map((p) => ({
        catalogItemId: p.id,
        stockMin: parseStockMinValue(draftMins[p.id] ?? String(p.stockMin)),
      }));
    if (changes.length === 0) return;

    setSaving(true);
    try {
      await saveStockMinsAction(changes);
      await requestSync();
      setDraftMins({});
      await refresh();
    } finally {
      setSaving(false);
    }
  }, [products, draftMins, requestSync, refresh]);

  const headerInfo = React.useMemo(() => {
    const base =
      "Produtos do catálogo com controle de estoque. Defina o estoque mínimo para alertas.";
    if (pendingCount > 0) {
      return `${base} ${pendingCount} alteração(ões) pendente(s) — use Salvar no topo.`;
    }
    if (lowCount > 0) {
      return `${base} ${lowCount} item(ns) abaixo do mínimo.`;
    }
    return base;
  }, [lowCount, pendingCount]);

  const showTable = products.length > 0;
  const showEmpty = !showTable && !refreshing;

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <SetHeaderInfo>{headerInfo}</SetHeaderInfo>
      {canEdit ? (
        <EstoqueProdutosHeaderToolbar
          pendingCount={pendingCount}
          saving={saving}
          onSave={() => void savePending()}
        />
      ) : null}
      <Card>
        <CardContent className="pt-6">
          {refreshing && !showTable ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Atualizando…
            </div>
          ) : showEmpty ? (
            <EstoqueProdutosEmpty catalogItemCount={catalogItemCount} />
          ) : (
            <StockProductsDataTable
              products={products}
              canEdit={canEdit}
              draftMins={draftMins}
              onDraftMinChange={handleDraftMinChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EstoqueProdutosEmpty({
  catalogItemCount,
}: {
  catalogItemCount: number;
}) {
  const hasCatalogItems = catalogItemCount > 0;
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">
        Não há itens do tipo produto para gerenciar o estoque.
      </p>
      <p className="mt-2">
        {hasCatalogItems
          ? "Cadastre ou altere itens para o tipo produto no catálogo."
          : "Cadastre ao menos um produto no catálogo."}
      </p>
      <Button
        nativeButton={false}
        render={<Link href="/catalogo" />}
        variant="outline"
        size="sm"
        className="mt-4"
      >
        Ir para o catálogo
      </Button>
    </div>
  );
}
