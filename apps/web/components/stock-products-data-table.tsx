"use client";

import * as React from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type Table,
} from "@tanstack/react-table";

import type { StockProductRow } from "@/app/actions/stock";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type StockProductsTableMeta = {
  draftMins: Record<string, string>;
  onDraftMinChange: (productId: string, value: string) => void;
  canEdit: boolean;
};

export function parseStockMinValue(raw: string): number {
  return Math.max(0, parseInt(raw, 10) || 0);
}

export function isStockMinDirty(
  product: StockProductRow,
  draftMins: Record<string, string>,
): boolean {
  if (draftMins[product.id] === undefined) return false;
  return parseStockMinValue(draftMins[product.id]!) !== product.stockMin;
}

export function countDirtyStockMins(
  products: StockProductRow[],
  draftMins: Record<string, string>,
): number {
  return products.filter((p) => isStockMinDirty(p, draftMins)).length;
}

const columns: ColumnDef<StockProductRow>[] = [
  {
    accessorKey: "name",
    header: "Produto",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "stockQty",
    header: () => <span className="block text-right">Saldo</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        {row.original.stockQty}
      </span>
    ),
  },
  {
    id: "stockMin",
    header: () => <span className="block text-right">Mínimo</span>,
    cell: ({ row, table }) => <StockMinCell row={row} table={table} />,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.isLow ? (
        <Badge variant="destructive">Baixo</Badge>
      ) : (
        <Badge variant="outline">OK</Badge>
      ),
  },
];

function getMeta(table: Table<StockProductRow>): StockProductsTableMeta {
  return (table.options.meta ?? {}) as StockProductsTableMeta;
}

function StockMinCell({
  row,
  table,
}: {
  row: Row<StockProductRow>;
  table: Table<StockProductRow>;
}) {
  const { draftMins, onDraftMinChange, canEdit } = getMeta(table);
  const product = row.original;

  if (!canEdit) {
    return (
      <span className="block text-right tabular-nums text-muted-foreground">
        {product.stockMin}
      </span>
    );
  }

  const value = draftMins[product.id] ?? String(product.stockMin);
  const isDirty = isStockMinDirty(product, draftMins);

  return (
    <MinStockInput
      productId={product.id}
      savedMin={product.stockMin}
      value={value}
      isDirty={isDirty}
      onChange={onDraftMinChange}
    />
  );
}

const MinStockInput = React.memo(function MinStockInput({
  productId,
  savedMin,
  value,
  isDirty,
  onChange,
}: {
  productId: string;
  savedMin: number;
  value: string;
  isDirty: boolean;
  onChange: (productId: string, value: string) => void;
}) {
  return (
    <Input
      className={cn(
        "ml-auto w-24 text-right transition-shadow",
        isDirty &&
          "border-amber-400 bg-amber-50/80 ring-2 ring-amber-400/90 dark:border-amber-500 dark:bg-amber-950/30 dark:ring-amber-500/80",
      )}
      type="number"
      min={0}
      value={value}
      aria-invalid={isDirty}
      aria-label={`Estoque mínimo${isDirty ? " (alterado, não salvo)" : ""}`}
      onChange={(e) => onChange(productId, e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onChange(productId, String(savedMin));
        }
      }}
    />
  );
});

export function StockProductsDataTable({
  products,
  canEdit,
  draftMins,
  onDraftMinChange,
}: {
  products: StockProductRow[];
  canEdit: boolean;
  draftMins: Record<string, string>;
  onDraftMinChange: (productId: string, value: string) => void;
}) {
  const [globalFilter, setGlobalFilter] = React.useState("");

  const tableMeta = React.useMemo(
    (): StockProductsTableMeta => ({
      draftMins,
      onDraftMinChange,
      canEdit,
    }),
    [draftMins, onDraftMinChange, canEdit],
  );

  const table = useReactTable({
    data: products,
    columns,
    meta: tableMeta,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).trim().toLowerCase();
      if (!q) return true;
      return row.original.name.toLowerCase().includes(q);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Buscar produto…"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />
      {!canEdit ? (
        <p className="text-sm text-muted-foreground">
          Você pode visualizar os produtos, mas não alterar o estoque mínimo.
        </p>
      ) : null}
      <DataTable
        table={table}
        emptyMessage={
          globalFilter
            ? "Nenhum produto encontrado para esta busca."
            : "Nenhum produto do tipo produto no catálogo."
        }
      />
    </div>
  );
}
