"use client";

import * as React from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import type { CashFlowRow } from "@boilerplate/db";
import { formatBrl } from "@/lib/format-money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function entryTypeLabel(row: CashFlowRow): string {
  const base = row.entry_type === "entrada" ? "Entrada" : "Saída";
  if (row.status === "previsto") return `${base} · previsto`;
  return base;
}

export function CashFlowDataTable({
  entries,
  onMarkPaid,
}: {
  entries: CashFlowRow[];
  onMarkPaid: (entryId: string) => Promise<void>;
}) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [payingId, setPayingId] = React.useState<string | null>(null);

  const columns = React.useMemo<ColumnDef<CashFlowRow>[]>(
    () => [
      {
        id: "date",
        header: "Data",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {new Date(row.original.created_at).toLocaleDateString("pt-BR")}
          </span>
        ),
      },
      {
        id: "type",
        header: "Tipo",
        cell: ({ row }) => {
          const isPrevisto = row.original.status === "previsto";
          return (
            <Badge
              variant={
                row.original.entry_type === "entrada" ? "secondary" : "outline"
              }
              className={cn(isPrevisto && "border-dashed")}
            >
              {entryTypeLabel(row.original)}
            </Badge>
          );
        },
      },
      {
        id: "description",
        header: "Descrição",
        cell: ({ row }) => (
          <span className="min-w-0">{row.original.description}</span>
        ),
      },
      {
        id: "amount",
        header: () => <span className="block text-right">Valor</span>,
        cell: ({ row }) => (
          <span
            className={cn(
              "block text-right font-medium tabular-nums",
              row.original.entry_type === "saida"
                ? "text-destructive"
                : "text-emerald-600 dark:text-emerald-500",
            )}
          >
            {formatBrl(row.original.amount_cents)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Ações</span>,
        cell: ({ row }) => {
          const canPay =
            row.original.entry_type === "saida" &&
            row.original.status === "previsto";
          if (!canPay) return null;
          const busy = payingId === row.original.id;
          return (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={async () => {
                  setPayingId(row.original.id);
                  try {
                    await onMarkPaid(row.original.id);
                  } finally {
                    setPayingId(null);
                  }
                }}
              >
                {busy ? "Salvando…" : "Pagar"}
              </Button>
            </div>
          );
        },
      },
    ],
    [onMarkPaid, payingId],
  );

  const table = useReactTable({
    data: entries,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).trim().toLowerCase();
      if (!q) return true;
      const e = row.original;
      return (
        e.description.toLowerCase().includes(q) ||
        entryTypeLabel(e).toLowerCase().includes(q)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Buscar por descrição ou tipo…"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-md"
      />
      <DataTable
        table={table}
        emptyMessage={
          globalFilter
            ? "Nenhum lançamento encontrado para esta busca."
            : "Nenhum lançamento."
        }
      />
    </div>
  );
}
