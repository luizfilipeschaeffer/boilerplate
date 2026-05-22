"use client";

import type { ModuloPrecoRow } from "@boilerplate/db";
import type { ModuleDefinition } from "@boilerplate/shared";
import { formatCentavosBRL } from "@boilerplate/billing";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { saveModuloPrecoAction } from "./actions";
import { ModulosDataTableSearch } from "./modulos-data-table-search";
import {
  centsToReaisInput,
  reaisInputToCents,
} from "./modulos-pricing-utils";

const STATUS_LABELS: Record<ModuleDefinition["implementationStatus"], string> = {
  implemented: "Implementado",
  scaffold: "Scaffold",
  deprecated: "Descontinuado",
};

type CatalogoRow = ModuleDefinition & {
  preco?: ModuloPrecoRow;
};

type ModuloDraft = {
  price: string;
  faseMin: string;
  addon: boolean;
  ativo: boolean;
};

function draftFromRow(row: CatalogoRow): ModuloDraft {
  const preco = row.preco;
  return {
    price: centsToReaisInput(preco?.precoMensalCentavos ?? 0),
    faseMin: String(preco?.faseMinima ?? row.faseMinima),
    addon: preco?.cobrancaAvulsa ?? true,
    ativo: preco?.ativo ?? true,
  };
}

type CatalogoTableMeta = {
  canEdit: boolean;
  drafts: Record<string, ModuloDraft>;
  updateDraft: (moduleId: string, patch: Partial<ModuloDraft>) => void;
  savingId: string | null;
  setSavingId: (id: string | null) => void;
};

export function ModulosCatalogoView({
  modules,
  precos,
  canEdit,
}: {
  modules: ModuleDefinition[];
  precos: ModuloPrecoRow[];
  canEdit: boolean;
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const precoMap = useMemo(
    () => new Map(precos.map((p) => [p.moduleId, p])),
    [precos],
  );

  const data = useMemo<CatalogoRow[]>(
    () =>
      modules.map((mod) => ({
        ...mod,
        preco: precoMap.get(mod.id),
      })),
    [modules, precoMap],
  );

  const [drafts, setDrafts] = useState<Record<string, ModuloDraft>>(() =>
    Object.fromEntries(data.map((row) => [row.id, draftFromRow(row)])),
  );

  useEffect(() => {
    setDrafts(Object.fromEntries(data.map((row) => [row.id, draftFromRow(row)])));
  }, [data]);

  const updateDraft = (moduleId: string, patch: Partial<ModuloDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], ...patch },
    }));
  };

  const columns = useMemo<ColumnDef<CatalogoRow>[]>(
    () => [
      {
        id: "modulo",
        header: "Módulo",
        accessorFn: (row) => `${row.name} ${row.id}`,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="font-mono text-xs text-muted-foreground">
              {row.original.id}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => STATUS_LABELS[row.implementationStatus],
        cell: ({ row }) => (
          <Badge variant="secondary">
            {STATUS_LABELS[row.original.implementationStatus]}
          </Badge>
        ),
      },
      {
        id: "faseMin",
        header: "Fase mín.",
        cell: ({ row, table }) => {
          const meta = table.options.meta as CatalogoTableMeta;
          const draft = meta.drafts[row.original.id];
          if (!meta.canEdit) {
            return (
              <span>{row.original.preco?.faseMinima ?? row.original.faseMinima}</span>
            );
          }
          return (
            <Input
              type="number"
              min={1}
              max={4}
              className="h-8 w-16"
              value={draft.faseMin}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) =>
                meta.updateDraft(row.original.id, { faseMin: e.target.value })
              }
            />
          );
        },
      },
      {
        id: "preco",
        header: "Preço/mês",
        cell: ({ row, table }) => {
          const meta = table.options.meta as CatalogoTableMeta;
          const draft = meta.drafts[row.original.id];
          if (!meta.canEdit) {
            return (
              <span className="tabular-nums">
                {formatCentavosBRL(row.original.preco?.precoMensalCentavos ?? 0)}
              </span>
            );
          }
          return (
            <Input
              className="h-8 w-28"
              value={draft.price}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) =>
                meta.updateDraft(row.original.id, { price: e.target.value })
              }
            />
          );
        },
      },
      {
        id: "addon",
        header: "Add-on",
        cell: ({ row, table }) => {
          const meta = table.options.meta as CatalogoTableMeta;
          const draft = meta.drafts[row.original.id];
          if (!meta.canEdit) return <span>{draft.addon ? "Sim" : "Incluído"}</span>;
          return (
            <Checkbox
              checked={draft.addon}
              onClick={(e) => e.stopPropagation()}
              onCheckedChange={(v) =>
                meta.updateDraft(row.original.id, { addon: v === true })
              }
            />
          );
        },
      },
      {
        id: "ativo",
        header: "Ativo",
        cell: ({ row, table }) => {
          const meta = table.options.meta as CatalogoTableMeta;
          const draft = meta.drafts[row.original.id];
          if (!meta.canEdit) return <span>{draft.ativo ? "Sim" : "Não"}</span>;
          return (
            <Checkbox
              checked={draft.ativo}
              onClick={(e) => e.stopPropagation()}
              onCheckedChange={(v) =>
                meta.updateDraft(row.original.id, { ativo: v === true })
              }
            />
          );
        },
      },
      ...(canEdit
        ? [
            {
              id: "actions",
              header: () => <span className="sr-only">Ações</span>,
              cell: ({ row, table }) => {
                const meta = table.options.meta as CatalogoTableMeta;
                const draft = meta.drafts[row.original.id];
                const saving = meta.savingId === row.original.id;
                return (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    onClick={async (e) => {
                      e.stopPropagation();
                      meta.setSavingId(row.original.id);
                      try {
                        await saveModuloPrecoAction({
                          moduleId: row.original.id,
                          precoMensalCentavos: reaisInputToCents(draft.price),
                          faseMinima:
                            Number(draft.faseMin) || row.original.faseMinima,
                          cobrancaAvulsa: draft.addon,
                          ativo: draft.ativo,
                        });
                      } finally {
                        meta.setSavingId(null);
                      }
                    }}
                  >
                    {saving ? "…" : "Salvar"}
                  </Button>
                );
              },
            } as ColumnDef<CatalogoRow>,
          ]
        : []),
    ],
    [canEdit],
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    meta: {
      canEdit,
      drafts,
      updateDraft,
      savingId,
      setSavingId,
    } satisfies CatalogoTableMeta,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).trim().toLowerCase();
      if (!q) return true;
      const m = row.original;
      return (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        STATUS_LABELS[m.implementationStatus].toLowerCase().includes(q)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <ModulosDataTableSearch
        value={globalFilter}
        onChange={setGlobalFilter}
        placeholder="Buscar por nome, id ou status…"
      />
      <DataTable
        table={table}
        emptyMessage={
          globalFilter
            ? "Nenhum módulo encontrado para esta busca."
            : "Nenhum módulo no catálogo."
        }
      />
    </div>
  );
}
