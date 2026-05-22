"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";

import type { StockMovementBatchRow } from "@/app/actions/stock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const MOVEMENT_LABELS: Record<string, string> = {
  entrada: "Entrada",
  saida: "Saída",
  ajuste: "Ajuste",
};

function movementLabel(type: string): string {
  return MOVEMENT_LABELS[type] ?? type;
}

function movementBadgeVariant(
  type: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (type === "entrada") return "default";
  if (type === "saida") return "destructive";
  return "secondary";
}

function linesSummary(lines: StockMovementBatchRow["lines"]): string {
  if (lines.length === 0) return "—";
  if (lines.length === 1) {
    const l = lines[0]!;
    return `${l.quantity}× ${l.productName}`;
  }
  return `${lines.length} produtos`;
}

export function StockMovementsDataTable({
  batches,
}: {
  batches: StockMovementBatchRow[];
}) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const columns = React.useMemo<ColumnDef<StockMovementBatchRow>[]>(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8"
            onClick={() => row.toggleExpanded()}
            aria-expanded={row.getIsExpanded()}
            aria-label={
              row.getIsExpanded()
                ? "Recolher produtos do registro"
                : "Ver produtos do registro"
            }
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        ),
      },
      {
        id: "date",
        header: "Data",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>
        ),
      },
      {
        accessorKey: "movementType",
        header: "Movimento",
        cell: ({ row }) => (
          <Badge variant={movementBadgeVariant(row.original.movementType)}>
            {movementLabel(row.original.movementType)}
          </Badge>
        ),
      },
      {
        id: "products",
        header: "Produtos",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {linesSummary(row.original.lines)}
          </span>
        ),
      },
      {
        accessorKey: "note",
        header: "Observação",
        cell: ({ row }) => (
          <span className="max-w-[240px] truncate text-muted-foreground">
            {row.original.note?.trim() || "—"}
          </span>
        ),
      },
      {
        id: "itemCount",
        header: () => <span className="block text-right">Itens</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {row.original.lines.length}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: batches,
    columns,
    state: { globalFilter, expanded },
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).trim().toLowerCase();
      if (!q) return true;
      const b = row.original;
      if (movementLabel(b.movementType).toLowerCase().includes(q)) return true;
      if (b.note?.toLowerCase().includes(q)) return true;
      return b.lines.some((l) => l.productName.toLowerCase().includes(q));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  const rows = table.getRowModel().rows;
  const colCount = table.getAllColumns().length;

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Buscar por produto, movimento ou observação…"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-md"
      />
      <div className="overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    className={cn(
                      row.getIsExpanded() && "border-b-0 bg-muted/30",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() ? (
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={colCount} className="p-0">
                        <div className="border-t px-4 py-3">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Produtos neste registro
                          </p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead className="text-right">
                                  Quantidade
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {row.original.lines.map((line) => (
                                <TableRow key={line.id}>
                                  <TableCell className="font-medium">
                                    {line.productName}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    {line.quantity}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  {globalFilter
                    ? "Nenhum registro encontrado para esta busca."
                    : "Nenhuma movimentação registrada ainda."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
