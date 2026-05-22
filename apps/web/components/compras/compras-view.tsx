"use client";

import Link from "next/link";
import * as React from "react";
import { ClipboardList, Sparkles, Truck } from "lucide-react";

import {
  generatePurchaseOrdersFromLowStockAction,
  listPurchaseOrdersAction,
  type PurchaseOrderDto,
} from "@/app/actions/purchase-orders";
import { SetHeaderActions } from "@/components/header-actions-context";
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
import { COMPRAS_ROUTES } from "@/lib/compras-access";

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  parcial: "Parcial",
  recebida: "Recebida",
  cancelada: "Cancelada",
};

export function ComprasView({
  initialOrders,
  canRegister,
}: {
  initialOrders: PurchaseOrderDto[];
  canRegister: boolean;
}) {
  const [orders, setOrders] = React.useState(initialOrders);
  const [generating, setGenerating] = React.useState(false);
  const [pending, setPending] = React.useState<
    Awaited<ReturnType<typeof generatePurchaseOrdersFromLowStockAction>>["pending"]
  >([]);
  const [message, setMessage] = React.useState<string | null>(null);

  async function refresh() {
    const list = await listPurchaseOrdersAction();
    setOrders(list);
  }

  async function handleGenerate() {
    setGenerating(true);
    setMessage(null);
    try {
      const result = await generatePurchaseOrdersFromLowStockAction();
      setPending(result.pending);
      if (result.created.length === 0 && result.pending.length === 0) {
        setMessage("Nenhum produto com estoque abaixo do mínimo.");
      } else if (result.created.length > 0) {
        setMessage(
          `${result.created.length} ordem(ns) em rascunho criada(s). Revise antes de enviar.`,
        );
      } else {
        setMessage(
          "Há itens em falta, mas faltam categoria ou fornecedor — veja pendências abaixo.",
        );
      }
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erro ao gerar compras.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <SetHeaderActions>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={COMPRAS_ROUTES.fornecedores} />}>
          <Truck className="size-4" />
          Fornecedores
        </Button>
        {canRegister ? (
          <Button size="sm" disabled={generating} onClick={() => void handleGenerate()}>
            <Sparkles className="size-4" />
            {generating ? "Gerando…" : "Gerar do estoque baixo"}
          </Button>
        ) : null}
      </SetHeaderActions>

      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}

      {pending.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pendências de vínculo</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              {pending.map((p) => (
                <li key={p.catalogItemId}>
                  <span className="text-foreground">{p.name}</span> — estoque{" "}
                  {p.stockQty}/{p.stockMin}:{" "}
                  {p.reason === "sem_categoria"
                    ? "sem categoria no catálogo"
                    : "sem fornecedor para a categoria"}
                </li>
              ))}
            </ul>
            <p className="mt-3">
              <Link href="/catalogo" className="underline">
                Catálogo
              </Link>{" "}
              e{" "}
              <Link href={COMPRAS_ROUTES.fornecedores} className="underline">
                fornecedores
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <ClipboardList className="size-5 text-muted-foreground" />
          <CardTitle className="text-base">Ordens de compra</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma ordem ainda. Use &quot;Gerar do estoque baixo&quot; ou cadastre
              fornecedores e categorias antes.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link
                        href={`/compras/${o.id}`}
                        className="font-medium hover:underline"
                      >
                        {o.supplierName ?? "Fornecedor"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {STATUS_LABEL[o.status] ?? o.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{o.lines.length}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
