"use client";

import type { PlatformIntegratorCatalogRow } from "@boilerplate/db/platform-integrators.types";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { ChevronRight, Settings2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ModulosDataTableSearch } from "@/modules/platform-modulos/modulos-data-table-search";
import {
  formatIntegratorTipo,
  INTEGRATOR_STATUS_LABELS,
} from "./integrator-labels";

export type IntegratorTableRow = PlatformIntegratorCatalogRow & {
  gatewayAtivo: boolean | null;
  gatewayDefault: boolean | null;
};

function statusVariant(
  status: PlatformIntegratorCatalogRow["implementationStatus"],
): "default" | "secondary" | "outline" {
  if (status === "implemented") return "default";
  if (status === "scaffold") return "secondary";
  return "outline";
}

export function IntegradoresListView({
  integrators,
  canEditGateways,
}: {
  integrators: IntegratorTableRow[];
  canEditGateways: boolean;
}) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<IntegratorTableRow>[]>(
    () => [
      {
        id: "integrador",
        header: "Integrador",
        accessorFn: (row) =>
          `${row.label} ${row.id} ${row.provider ?? ""} ${row.description ?? ""}`,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.label}</div>
            <div className="font-mono text-xs text-muted-foreground">
              {row.original.id}
            </div>
            {row.original.provider ? (
              <div className="text-xs text-muted-foreground">
                {row.original.provider}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        id: "tipo",
        header: "Tipo",
        accessorFn: (row) => row.tipo,
        cell: ({ row }) => (
          <Badge variant="outline">{formatIntegratorTipo(row.original.tipo)}</Badge>
        ),
      },
      {
        id: "status",
        header: "Desenvolvimento",
        accessorFn: (row) => row.implementationStatus,
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.implementationStatus)}>
            {INTEGRATOR_STATUS_LABELS[row.original.implementationStatus]}
          </Badge>
        ),
      },
      {
        id: "marco",
        header: "Marco",
        accessorKey: "deliveryMarco",
        cell: ({ row }) =>
          row.original.deliveryMarco ? (
            <span className="font-mono text-xs">{row.original.deliveryMarco}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: "modulos",
        header: "Módulos",
        accessorFn: (row) => row.modulosSuportados.join(" "),
        cell: ({ row }) => {
          const mods = row.original.modulosSuportados;
          if (mods.includes("*")) {
            return <span className="text-xs text-muted-foreground">Todos</span>;
          }
          const preview = mods.slice(0, 2);
          const restante = mods.length - preview.length;
          return (
            <span className="text-xs text-muted-foreground">
              {preview.join(", ")}
              {restante > 0 ? ` +${restante}` : ""}
            </span>
          );
        },
      },
      {
        id: "gateway",
        header: "Gateway",
        cell: ({ row }) => {
          if (row.original.tipo !== "payment") {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          if (row.original.gatewayAtivo === null) {
            return (
              <span className="text-xs text-muted-foreground">Não configurado</span>
            );
          }
          return (
            <div className="flex flex-wrap gap-1">
              <Badge variant={row.original.gatewayAtivo ? "default" : "secondary"}>
                {row.original.gatewayAtivo ? "Ativo" : "Inativo"}
              </Badge>
              {row.original.gatewayDefault ? (
                <Badge variant="outline">Padrão</Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "acoes",
        header: "Ações",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {row.original.tipo === "payment" && canEditGateways ? (
              <Link
                href="/integradores/gateways"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "h-8 gap-1",
                })}
              >
                <Settings2 className="size-3.5" />
                Gateways
              </Link>
            ) : (
              <ChevronRight className="size-4 text-muted-foreground opacity-40" />
            )}
          </div>
        ),
      },
    ],
    [canEditGateways],
  );

  const table = useReactTable({
    data: integrators,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const implemented = integrators.filter(
    (i) => i.implementationStatus === "implemented",
  ).length;
  const planned = integrators.filter(
    (i) => i.implementationStatus === "planned",
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {integrators.length} integradores no catálogo ({implemented} implementados,{" "}
        {planned} planejados). Dados em{" "}
        <code className="rounded bg-muted px-1 text-xs">platform-catalog.json</code>{" "}
        — atualize com{" "}
        <code className="rounded bg-muted px-1 text-xs">bun run db:seed-roadmap</code>
        .
      </p>
      <ModulosDataTableSearch
        value={globalFilter}
        onChange={setGlobalFilter}
        placeholder="Buscar por nome, id ou provedor…"
      />
      <DataTable
        table={table}
        emptyMessage="Nenhum integrador encontrado."
      />
    </div>
  );
}
