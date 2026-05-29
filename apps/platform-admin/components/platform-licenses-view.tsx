"use client";

import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ClientLicenseAdminRow } from "@boilerplate/db/self-hosted";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ModulosDataTableSearch } from "@/modules/platform-modulos/modulos-data-table-search";

function tierVariant(
  tier: ClientLicenseAdminRow["licenseTier"],
): "default" | "secondary" | "outline" {
  if (tier === "pago") return "default";
  if (tier === "trial") return "secondary";
  return "outline";
}

function tierLabel(tier: ClientLicenseAdminRow["licenseTier"]): string {
  if (tier === "pago") return "Pago";
  if (tier === "trial") return "Trial";
  return "Gratuito";
}

function LicensesTablePagination<T>({
  table,
}: {
  table: ReturnType<typeof useReactTable<T>>;
}) {
  const total = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <div className="flex flex-col gap-2 border-t px-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">
        {total} cliente(s) · página {pageIndex + 1} de {Math.max(pageCount, 1)}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}

export function PlatformLicensesView({
  clients,
}: {
  clients: ClientLicenseAdminRow[];
}) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<ClientLicenseAdminRow>[]>(
    () => [
      {
        id: "cliente",
        header: "Cliente",
        accessorFn: (row) =>
          `${row.organizationName} ${row.organizationSlug} ${row.ownerEmail ?? ""}`,
        cell: ({ row }) => (
          <div>
            <Link
              href={`/organizacoes/${row.original.organizationId}`}
              className="font-medium hover:underline"
            >
              {row.original.organizationName}
            </Link>
            <div className="font-mono text-xs text-muted-foreground">
              {row.original.organizationSlug}
            </div>
            {row.original.ownerEmail ? (
              <div className="text-xs text-muted-foreground">{row.original.ownerEmail}</div>
            ) : null}
          </div>
        ),
      },
      {
        id: "tipo",
        header: "Tipo",
        accessorKey: "licenseTier",
        cell: ({ row }) => (
          <Badge variant={tierVariant(row.original.licenseTier)}>
            {tierLabel(row.original.licenseTier)}
          </Badge>
        ),
      },
      {
        id: "plano",
        header: "Plano atual",
        accessorKey: "displayPlan",
        cell: ({ row }) => (
          <div>
            <span>{row.original.displayPlan}</span>
            {row.original.planId ? (
              <div className="font-mono text-xs text-muted-foreground">
                {row.original.planId}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status da licença",
        accessorKey: "displayStatus",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.displayStatus}</Badge>
        ),
      },
      {
        id: "expira",
        header: "Expira em",
        accessorFn: (row) => row.subscriptionExpiresAt ?? row.trialEndsAt ?? "",
        cell: ({ row }) => {
          const raw =
            row.original.subscriptionExpiresAt ?? row.original.trialEndsAt;
          return (
            <span className="text-muted-foreground text-sm">
              {raw ? new Date(raw).toLocaleDateString("pt-BR") : "—"}
            </span>
          );
        },
      },
      {
        id: "entitlements",
        header: "Entitlements",
        accessorFn: (row) => row.entitlements.join(" "),
        cell: ({ row }) => {
          const items = row.original.entitlements;
          if (items.length === 0) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          const preview = items.slice(0, 3);
          const rest = items.length - preview.length;
          return (
            <span className="text-xs text-muted-foreground" title={items.join(", ")}>
              {preview.join(", ")}
              {rest > 0 ? ` +${rest}` : ""}
            </span>
          );
        },
      },
      {
        id: "instalacoes",
        header: "VPS",
        accessorKey: "installationsCount",
        cell: ({ row }) =>
          row.original.installationsCount > 0 ? (
            <Link
              href="/instalacoes"
              className="text-primary text-sm hover:underline"
            >
              {row.original.installationsCount} instalação(ões)
            </Link>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: clients,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageSize: 15 } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const paid = clients.filter((c) => c.licenseTier === "pago").length;
  const trial = clients.filter((c) => c.licenseTier === "trial").length;
  const free = clients.filter((c) => c.licenseTier === "gratuito").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Licenças e assinaturas</CardTitle>
        <CardDescription>
          Todos os clientes (organizações) e a licença vigente — do trial gratuito ao plano
          pago. {clients.length} no total ({paid} pagos, {trial} em trial, {free} gratuitos).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ModulosDataTableSearch
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder="Buscar por cliente, e-mail, plano ou status…"
        />
        <DataTable table={table} emptyMessage="Nenhum cliente encontrado." />
        <LicensesTablePagination table={table} />
      </CardContent>
    </Card>
  );
}
