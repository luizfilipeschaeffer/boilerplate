"use client";

import Link from "next/link";
import * as React from "react";

import {
  listStockMovimentacaoPageAction,
  type StockMovementBatchRow,
  type StockProductRow,
} from "@/app/actions/stock";
import { EstoqueHeaderToolbar } from "@/components/estoque-header-toolbar";
import { SetHeaderInfo } from "@/components/header-actions-context";
import { StockMovementsDataTable } from "@/components/stock-movements-data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CACHE_UPDATED_EVENT } from "@/lib/idb/types";

export function EstoqueMovimentacaoView({
  initialProducts,
  initialMovementBatches,
  initialCatalogItemCount,
  canRegister,
}: {
  initialProducts: StockProductRow[];
  initialMovementBatches: StockMovementBatchRow[];
  initialCatalogItemCount: number;
  canRegister: boolean;
}) {
  const [products, setProducts] = React.useState(initialProducts);
  const [movementBatches, setMovementBatches] = React.useState(
    initialMovementBatches,
  );
  const [catalogItemCount, setCatalogItemCount] = React.useState(
    initialCatalogItemCount,
  );
  const [refreshing, setRefreshing] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await listStockMovimentacaoPageAction();
      setProducts(data.products);
      setMovementBatches(data.movementBatches);
      setCatalogItemCount(data.catalogItemCount);
    } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    const onCache = () => void refresh();
    window.addEventListener(CACHE_UPDATED_EVENT, onCache);
    return () => window.removeEventListener(CACHE_UPDATED_EVENT, onCache);
  }, [refresh]);

  const hasProducts = products.length > 0;

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <SetHeaderInfo>
        Registre entradas e ajustes de saldo. Saídas automáticas ocorrem nas
        vendas confirmadas.
      </SetHeaderInfo>
      {canRegister && hasProducts ? (
        <EstoqueHeaderToolbar
          products={products}
          onChanged={refresh}
        />
      ) : null}

      {!hasProducts && !refreshing ? (
        <EstoqueMovimentacaoEmpty catalogItemCount={catalogItemCount} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Registros de movimentação</CardTitle>
            <CardDescription>
              Histórico de entradas e ajustes. Expanda cada registro para ver os
              produtos incluídos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {refreshing ? (
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Atualizando…
              </div>
            ) : null}
            {!canRegister ? (
              <p className="mb-4 text-sm text-muted-foreground">
                Você pode consultar o histórico, mas não registrar novos
                movimentos.
              </p>
            ) : null}
            <StockMovementsDataTable batches={movementBatches} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EstoqueMovimentacaoEmpty({
  catalogItemCount,
}: {
  catalogItemCount: number;
}) {
  const hasCatalogItems = catalogItemCount > 0;
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">
        Cadastre produtos antes de registrar movimentação.
      </p>
      <p className="mt-2">
        {hasCatalogItems
          ? "Nenhum item do tipo produto no catálogo."
          : "Adicione produtos no catálogo para controlar entradas e ajustes."}
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
