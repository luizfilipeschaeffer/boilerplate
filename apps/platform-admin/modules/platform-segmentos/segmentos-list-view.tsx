"use client";

import type { MarketSegmentRow } from "@boilerplate/db";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ModulosDataTableSearch } from "@/modules/platform-modulos/modulos-data-table-search";

export function SegmentosListView({
  segments,
  canEdit,
}: {
  segments: MarketSegmentRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState("");

  function abrirFases(segment: MarketSegmentRow) {
    router.push(`/segmentos/${segment.slug}/fases`);
  }

  const columns = useMemo<ColumnDef<MarketSegmentRow>[]>(
    () => [
      {
        id: "segmento",
        header: "Segmento",
        accessorFn: (row) => `${row.name} ${row.slug}`,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="font-mono text-xs text-muted-foreground">
              {row.original.slug}
            </div>
          </div>
        ),
      },
      {
        id: "ordem",
        header: "Ordem",
        accessorKey: "ordem",
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.ordem}
          </span>
        ),
      },
      {
        id: "tipos",
        header: "Tipos de negócio",
        accessorFn: (row) => row.tipoNegocioSugeridos.join(" "),
        cell: ({ row }) => {
          const tipos = row.original.tipoNegocioSugeridos;
          if (tipos.length === 0) {
            return (
              <span className="text-xs text-muted-foreground">Todos</span>
            );
          }
          const preview = tipos.slice(0, 2);
          const restante = tipos.length - preview.length;
          return (
            <span className="text-xs text-muted-foreground">
              {preview.join(", ")}
              {restante > 0 ? ` +${restante}` : ""}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.ativo ? "default" : "secondary"}>
            {row.original.ativo ? "Ativo" : "Inativo"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Ações</span>,
        cell: () => (
          <div className="flex justify-end text-muted-foreground">
            <ChevronRight className="size-4" aria-hidden />
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: segments,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).trim().toLowerCase();
      if (!q) return true;
      const s = row.original;
      return (
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.tipoNegocioSugeridos.some((t) => t.toLowerCase().includes(q))
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {segments.length} segmentos de mercado. Clique em uma linha para{" "}
        {canEdit ? "configurar fases e bundles" : "ver as fases"}.
      </p>
      <ModulosDataTableSearch
        value={globalFilter}
        onChange={setGlobalFilter}
        placeholder="Buscar por nome, slug ou tipo de negócio…"
      />
      <DataTable
        table={table}
        onRowClick={abrirFases}
        emptyMessage={
          globalFilter
            ? "Nenhum segmento encontrado para esta busca."
            : "Nenhum segmento cadastrado."
        }
      />
    </div>
  );
}
