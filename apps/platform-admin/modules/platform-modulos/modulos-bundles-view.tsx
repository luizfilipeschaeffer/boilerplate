"use client";

import type { BundlePrecoRow } from "@boilerplate/db";
import type { ModuleDefinition } from "@boilerplate/shared";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { formatCentavosBRL } from "@boilerplate/billing";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  BundleEditDialog,
  type BundleDialogMode,
} from "./bundle-edit-dialog";
import { PlanoStatusBadge } from "./plano-edit-dialog";
import { ModulosDataTableSearch } from "./modulos-data-table-search";

export function ModulosBundlesView({
  modules,
  bundles,
  canEdit,
}: {
  modules: ModuleDefinition[];
  bundles: BundlePrecoRow[];
  canEdit: boolean;
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<BundleDialogMode>("edit");
  const [bundleEmEdicao, setBundleEmEdicao] = useState<BundlePrecoRow | null>(
    null,
  );

  function abrirBundle(bundle: BundlePrecoRow) {
    setDialogMode("edit");
    setBundleEmEdicao(bundle);
    setDialogOpen(true);
  }

  function abrirNovoBundle() {
    setDialogMode("create");
    setBundleEmEdicao(null);
    setDialogOpen(true);
  }

  const columns = useMemo<ColumnDef<BundlePrecoRow>[]>(
    () => [
      {
        id: "bundle",
        header: "Bundle",
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
        id: "modulos",
        header: "Módulos",
        accessorFn: (row) => row.moduleIds.join(" "),
        cell: ({ row }) => {
          const ids = row.original.moduleIds;
          const preview = ids.slice(0, 3);
          const restante = ids.length - preview.length;
          return (
            <div className="max-w-xs">
              <div className="text-xs text-muted-foreground">
                {ids.length} módulo{ids.length === 1 ? "" : "s"}
              </div>
              <div className="mt-0.5 truncate font-mono text-xs">
                {preview.join(", ")}
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
                abrirBundle(row.original);
              }}
            >
              {canEdit ? "Editar" : "Ver"}
            </Button>
          </div>
        ),
      },
    ],
    [canEdit],
  );

  const table = useReactTable({
    data: bundles,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).trim().toLowerCase();
      if (!q) return true;
      const b = row.original;
      return (
        b.nome.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.moduleIds.some((id) => id.toLowerCase().includes(q))
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
            <Button type="button" onClick={abrirNovoBundle}>
              Novo bundle
            </Button>
          ) : null}
        </div>
        <DataTable
          table={table}
          onRowClick={abrirBundle}
          emptyMessage={
            globalFilter
              ? "Nenhum bundle encontrado para esta busca."
              : "Nenhum bundle cadastrado."
          }
        />
      </div>
      <BundleEditDialog
        bundle={bundleEmEdicao}
        mode={dialogMode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        modules={modules}
        canEdit={canEdit}
      />
    </>
  );
}
