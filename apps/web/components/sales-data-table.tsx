"use client";

import * as React from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import { formatBrl } from "@/lib/format-money";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";

export type SaleRow = {
  id: string;
  clientName: string | null;
  paymentMethod: string;
  totalCents: number;
  createdAt: Date;
  items: { itemName: string; quantity: number }[];
};

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_credito: "Cartão crédito",
  cartao_debito: "Cartão débito",
  outro: "Outro",
};

function paymentLabel(method: string): string {
  return PAYMENT_LABELS[method] ?? method;
}

function itemsSummary(items: SaleRow["items"]): string {
  if (items.length === 0) return "—";
  return items.map((it) => `${it.quantity}× ${it.itemName}`).join(", ");
}

export function SalesDataTable({ sales }: { sales: SaleRow[] }) {
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns = React.useMemo<ColumnDef<SaleRow>[]>(
    () => [
      {
        id: "date",
        header: "Data",
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {row.original.createdAt.toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>
        ),
      },
      {
        id: "client",
        header: "Cliente",
        cell: ({ row }) => (
          <span>{row.original.clientName ?? "—"}</span>
        ),
      },
      {
        id: "items",
        header: "Itens",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {itemsSummary(row.original.items)}
          </span>
        ),
      },
      {
        id: "payment",
        header: "Pagamento",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {paymentLabel(row.original.paymentMethod)}
          </Badge>
        ),
      },
      {
        id: "total",
        header: () => <span className="block text-right">Total</span>,
        cell: ({ row }) => (
          <span className="block text-right font-medium tabular-nums">
            {formatBrl(row.original.totalCents)}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: sales,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).trim().toLowerCase();
      if (!q) return true;
      const s = row.original;
      return (
        (s.clientName?.toLowerCase().includes(q) ?? false) ||
        paymentLabel(s.paymentMethod).toLowerCase().includes(q) ||
        s.items.some((it) => it.itemName.toLowerCase().includes(q))
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Buscar por cliente, item ou pagamento…"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-md"
      />
      <DataTable
        table={table}
        emptyMessage={
          globalFilter
            ? "Nenhuma venda encontrada para esta busca."
            : "Nenhuma venda registrada. Use Registrar venda no topo."
        }
      />
    </div>
  );
}
