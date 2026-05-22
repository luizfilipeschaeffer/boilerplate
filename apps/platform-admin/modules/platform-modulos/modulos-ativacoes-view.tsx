"use client";

import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ModulosDataTableSearch } from "./modulos-data-table-search";

type AtivacaoRow = { moduloId: string; count: number };

export function ModulosAtivacoesView({
  ativacoes,
}: {
  ativacoes: AtivacaoRow[];
}) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<AtivacaoRow>[]>(
    () => [
      {
        accessorKey: "moduloId",
        header: "Módulo",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.moduloId}</span>
        ),
      },
      {
        accessorKey: "count",
        header: () => <span className="block text-right">Organizações</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {row.original.count}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: ativacoes,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).trim().toLowerCase();
      if (!q) return true;
      return row.original.moduloId.toLowerCase().includes(q);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <ModulosDataTableSearch
        value={globalFilter}
        onChange={setGlobalFilter}
        placeholder="Buscar por id do módulo…"
      />
      <DataTable
        table={table}
        emptyMessage={
          globalFilter
            ? "Nenhuma ativação encontrada para esta busca."
            : "Nenhuma ativação registrada."
        }
      />
    </div>
  );
}
