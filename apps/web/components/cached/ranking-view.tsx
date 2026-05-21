"use client";

import * as React from "react";
import { useCachedStore } from "@/hooks/use-cached-store";
import type { CachedCatalogItem, CachedClient, CachedSale } from "@/lib/idb/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function computeRanking(sales: CachedSale[], catalog: CachedCatalogItem[]) {
  const catalogMap = new Map(catalog.map((c) => [c.id, c.name]));
  const byItem = new Map<string, { name: string; qty: number; cents: number }>();
  const byClient = new Map<
    string,
    { name: string; count: number; cents: number }
  >();

  for (const sale of sales) {
    if (sale.status !== "confirmada") continue;
    if (sale.clientId && sale.clientName) {
      const cur = byClient.get(sale.clientId) ?? {
        name: sale.clientName,
        count: 0,
        cents: 0,
      };
      cur.count += 1;
      cur.cents += sale.totalCents;
      byClient.set(sale.clientId, cur);
    }
    for (const line of sale.items) {
      const name =
        line.itemName ?? catalogMap.get(line.catalogItemId) ?? line.catalogItemId;
      const cur = byItem.get(line.catalogItemId) ?? {
        name,
        qty: 0,
        cents: 0,
      };
      cur.qty += line.quantity;
      cur.cents += line.lineTotalCents;
      byItem.set(line.catalogItemId, cur);
    }
  }

  const items = [...byItem.entries()]
    .map(([id, v]) => ({
      catalog_item_id: id,
      name: v.name,
      total_qty: v.qty,
      total_cents: v.cents,
    }))
    .sort((a, b) => b.total_qty - a.total_qty)
    .slice(0, 10);

  const clients = [...byClient.entries()]
    .map(([id, v]) => ({
      client_id: id,
      name: v.name,
      sale_count: v.count,
      total_cents: v.cents,
    }))
    .sort((a, b) => b.total_cents - a.total_cents)
    .slice(0, 10);

  return { items, clients };
}

export function RankingCachedView() {
  const { data: sales } = useCachedStore<CachedSale>("sales");
  const { data: catalog } = useCachedStore<CachedCatalogItem>("catalog");
  const { data: clients } = useCachedStore<CachedClient>("clients");

  const { items, clients: topClients } = React.useMemo(
    () => computeRanking(sales, catalog),
    [sales, catalog],
  );

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Ranking</h2>
        <p className="text-sm text-muted-foreground">
          Calculado a partir do cache de vendas ({sales.length} no IndexedDB)
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top itens</CardTitle>
            <CardDescription>Por quantidade vendida</CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem vendas ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => (
                    <TableRow key={row.catalog_item_id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.total_qty}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(row.total_cents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top clientes</CardTitle>
            <CardDescription>Por valor total</CardDescription>
          </CardHeader>
          <CardContent>
            {topClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Vincule clientes às vendas ({clients.length} no cache).
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topClients.map((row) => (
                    <TableRow key={row.client_id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.sale_count}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(row.total_cents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
