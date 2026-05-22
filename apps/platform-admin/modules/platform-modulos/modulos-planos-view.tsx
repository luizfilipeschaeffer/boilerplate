"use client";

import type { PlanoBaseRow } from "@boilerplate/db";
import type { ModuleDefinition } from "@boilerplate/shared";
import { formatCentavosBRL } from "@boilerplate/billing";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  PlanoEditDialog,
  PlanoStatusBadge,
  type PlanoDialogMode,
} from "./plano-edit-dialog";
import { ModulosDataTableSearch } from "./modulos-data-table-search";

export function ModulosPlanosView({
  modules,
  planos,
  canEdit,
}: {
  modules: ModuleDefinition[];
  planos: PlanoBaseRow[];
  canEdit: boolean;
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [planoDialogOpen, setPlanoDialogOpen] = useState(false);
  const [planoDialogMode, setPlanoDialogMode] =
    useState<PlanoDialogMode>("edit");
  const [planoEmEdicao, setPlanoEmEdicao] = useState<PlanoBaseRow | null>(null);
  const moduleNameById = useMemo(
    () => new Map(modules.map((m) => [m.id, m.name])),
    [modules],
  );

  function abrirPlano(plano: PlanoBaseRow) {
    setPlanoDialogMode("edit");
    setPlanoEmEdicao(plano);
    setPlanoDialogOpen(true);
  }

  function abrirNovoPlano() {
    setPlanoDialogMode("create");
    setPlanoEmEdicao(null);
    setPlanoDialogOpen(true);
  }

  const columns = useMemo<ColumnDef<PlanoBaseRow>[]>(
    () => [
      {
        id: "plano",
        header: "Plano",
        accessorFn: (row) => `${row.nome} ${row.id}`,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.nome}</div>
            <div className="font-mono text-xs text-muted-foreground">
              {row.original.id}
            </div>
          </div>
        ),
      },
      {
        id: "preco",
        header: "Preço/mês",
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatCentavosBRL(row.original.precoMensalCentavos)}
          </span>
        ),
      },
      {
        id: "fases",
        header: "Fases",
        cell: ({ row }) => {
          const { faseMinima, faseMaxima } = row.original;
          return (
            <span className="whitespace-nowrap">
              {faseMinima === faseMaxima
                ? `Fase ${faseMinima}`
                : `${faseMinima} – ${faseMaxima}`}
            </span>
          );
        },
      },
      {
        id: "modulos",
        header: "Módulos",
        accessorFn: (row) => row.modulosInclusos.join(" "),
        cell: ({ row }) => {
          const preview = row.original.modulosInclusos.slice(0, 3);
          const restante = row.original.modulosInclusos.length - preview.length;
          return (
            <div className="max-w-xs">
              <div className="text-xs text-muted-foreground">
                {row.original.modulosInclusos.length} módulo
                {row.original.modulosInclusos.length === 1 ? "" : "s"}
              </div>
              <div className="mt-0.5 truncate text-xs">
                {preview
                  .map((id) => moduleNameById.get(id) ?? id)
                  .join(", ")}
                {restante > 0 ? ` +${restante}` : null}
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <PlanoStatusBadge ativo={row.original.ativo} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Ações</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                abrirPlano(row.original);
              }}
            >
              {canEdit ? "Editar" : "Ver"}
            </Button>
          </div>
        ),
      },
    ],
    [canEdit, moduleNameById],
  );

  const table = useReactTable({
    data: planos,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).trim().toLowerCase();
      if (!q) return true;
      const p = row.original;
      return (
        p.nome.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.modulosInclusos.some((id) => id.toLowerCase().includes(q))
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ModulosDataTableSearch
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder="Buscar por nome, id ou módulo…"
          />
          {canEdit ? (
            <Button type="button" onClick={abrirNovoPlano}>
              Novo plano
            </Button>
          ) : null}
        </div>
        <DataTable
          table={table}
          onRowClick={abrirPlano}
          emptyMessage={
            globalFilter
              ? "Nenhum plano encontrado para esta busca."
              : "Nenhum plano base cadastrado."
          }
        />
      </div>
      <PlanoEditDialog
        plano={planoEmEdicao}
        mode={planoDialogMode}
        open={planoDialogOpen}
        onOpenChange={setPlanoDialogOpen}
        modules={modules}
        canEdit={canEdit}
      />
    </>
  );
}
