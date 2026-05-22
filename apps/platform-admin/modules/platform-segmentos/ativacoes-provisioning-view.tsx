"use client";

import type { OrganizationProvisioningRow } from "@boilerplate/db";
import Link from "next/link";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  pre_active: "Pré-ativação",
  trial: "Trial",
  active: "Ativo",
  blocked: "Bloqueado",
};

export function AtivacoesProvisioningView({
  ativacoes,
}: {
  ativacoes: OrganizationProvisioningRow[];
}) {
  const columns = useMemo<ColumnDef<OrganizationProvisioningRow>[]>(
    () => [
      {
        id: "org",
        header: "Organização",
        accessorFn: (r) => r.name,
        cell: ({ row }) => (
          <div>
            <Link
              href={`/organizacoes/${row.original.id}`}
              className="font-medium hover:underline"
            >
              {row.original.name}
            </Link>
            <div className="text-xs text-muted-foreground font-mono">
              {row.original.slug}
            </div>
          </div>
        ),
      },
      {
        id: "segment",
        header: "Segmento",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.marketSegmentSlug ?? "—"}
          </span>
        ),
      },
      {
        id: "phase",
        header: "Fase",
        cell: ({ row }) => (
          <span className="tabular-nums text-sm">
            P{row.original.declaredPhase ?? row.original.phase}
            {row.original.diagnosedPhase != null &&
            row.original.diagnosedPhase !== row.original.declaredPhase ? (
              <span className="text-muted-foreground">
                {" "}
                (diag. P{row.original.diagnosedPhase})
              </span>
            ) : null}
          </span>
        ),
      },
      {
        id: "status",
        header: "Provisionamento",
        cell: ({ row }) => (
          <Badge variant="outline">
            {STATUS_LABELS[row.original.provisioningStatus] ??
              row.original.provisioningStatus}
          </Badge>
        ),
      },
      {
        id: "payment",
        header: "Pagamento",
        cell: ({ row }) =>
          row.original.paymentMethodVerifiedAt ? (
            <span className="text-xs text-muted-foreground">Verificado</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: "trial",
        header: "Trial até",
        cell: ({ row }) =>
          row.original.trialEndsAt ? (
            <span className="text-xs tabular-nums">
              {row.original.trialEndsAt.toLocaleDateString("pt-BR")}
            </span>
          ) : (
            "—"
          ),
      },
      {
        id: "modulos",
        header: "Módulos",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.modulosCount}</span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: ativacoes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Acompanhamento de pré-ativação, validação de pagamento e trials.
      </p>
      <DataTable table={table} />
    </div>
  );
}
