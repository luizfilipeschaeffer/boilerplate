"use client";

import Link from "next/link";
import * as React from "react";

import {
  cancelPurchaseOrderAction,
  getPurchaseOrderAction,
  sendPurchaseOrderAction,
  type PurchaseOrderDto,
} from "@/app/actions/purchase-orders";
import { listCatalogAction } from "@/app/actions/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PurchaseOrderDetail({
  initial,
  canEdit,
  canCancel,
}: {
  initial: PurchaseOrderDto;
  canEdit: boolean;
  canCancel: boolean;
}) {
  const [po, setPo] = React.useState(initial);
  const [itemNames, setItemNames] = React.useState<Map<string, string>>(new Map());
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    void listCatalogAction().then((items) => {
      setItemNames(new Map(items.map((i) => [i.id, i.name])));
    });
  }, []);

  async function reload() {
    const next = await getPurchaseOrderAction(po.id);
    if (next) setPo(next);
  }

  async function send() {
    setPending(true);
    try {
      await sendPurchaseOrderAction(po.id);
      await reload();
    } finally {
      setPending(false);
    }
  }

  async function cancel() {
    if (!confirm("Cancelar esta ordem de compra?")) return;
    setPending(true);
    try {
      await cancelPurchaseOrderAction(po.id);
      await reload();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/compras" />}>
          Voltar
        </Button>
        <Badge variant="secondary">{po.status}</Badge>
        {po.status === "rascunho" && canEdit ? (
          <Button size="sm" disabled={pending} onClick={() => void send()}>
            Marcar como enviada
          </Button>
        ) : null}
        {po.status === "rascunho" && canCancel ? (
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => void cancel()}
          >
            Cancelar
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {po.supplierName ?? "Fornecedor"}
          </CardTitle>
          {po.notes ? (
            <p className="text-sm text-muted-foreground">{po.notes}</p>
          ) : null}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    {itemNames.get(line.catalogItemId) ?? line.catalogItemId}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.quantity}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
