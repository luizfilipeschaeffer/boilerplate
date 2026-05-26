"use client";

import type {
  MarketSegmentRow,
  SegmentPhaseConfigRow,
  SegmentSectorModuleTemplateRow,
  SegmentSectorTemplateRow,
} from "@boilerplate/db";
import type { ModuleDefinition } from "@boilerplate/shared";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  FASE_LABELS,
  SegmentPhaseEditDialog,
} from "./segment-phase-edit-dialog";
import { SegmentoEditForm } from "./segmento-edit-form";

export type SegmentPhaseTableRow = {
  phase: number;
  label: string;
  config: SegmentPhaseConfigRow | null;
};

function buildPhaseRows(
  phases: SegmentPhaseConfigRow[],
): SegmentPhaseTableRow[] {
  return ([1, 2, 3, 4] as const).map((phase) => ({
    phase,
    label: FASE_LABELS[phase],
    config: phases.find((p) => p.phase === phase) ?? null,
  }));
}

export function SegmentoFasesView({
  segment,
  phases,
  sectorTemplates,
  moduleTemplates,
  modules,
  canEdit,
}: {
  segment: MarketSegmentRow;
  phases: SegmentPhaseConfigRow[];
  sectorTemplates: SegmentSectorTemplateRow[];
  moduleTemplates: SegmentSectorModuleTemplateRow[];
  modules: ModuleDefinition[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const rows = useMemo(() => buildPhaseRows(phases), [phases]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [phaseEmEdicao, setPhaseEmEdicao] = useState<SegmentPhaseTableRow | null>(
    null,
  );

  function abrirFase(row: SegmentPhaseTableRow) {
    setPhaseEmEdicao(row);
    setDialogOpen(true);
  }

  const columns = useMemo<ColumnDef<SegmentPhaseTableRow>[]>(
    () => [
      {
        id: "fase",
        header: "Fase",
        accessorFn: (row) => row.label,
        cell: ({ row }) => (
          <div className="font-medium">{row.original.label}</div>
        ),
      },
      {
        id: "bundle",
        header: "Bundle",
        cell: ({ row }) => {
          const id = row.original.config?.bundlePrecoId;
          return id ? (
            <span className="font-mono text-xs">{id}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          );
        },
      },
      {
        id: "modulos",
        header: "Módulos",
        cell: ({ row }) => {
          const count = row.original.config?.moduleIds.length ?? 0;
          const bundle = row.original.config?.bundlePrecoId;
          return (
            <span className="text-sm text-muted-foreground">
              {count > 0
                ? `${count} id${count === 1 ? "" : "s"}`
                : bundle
                  ? "via bundle"
                  : "fallback legado"}
            </span>
          );
        },
      },
      {
        id: "pagamento",
        header: "Pagamento",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.config?.requiresPaymentValidation
                ? "default"
                : "secondary"
            }
          >
            {row.original.config?.requiresPaymentValidation
              ? "Exige validação"
              : "Livre"}
          </Badge>
        ),
      },
      {
        id: "pre",
        header: "Pré-ativação",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.config?.preActivateModules !== false ? "Sim" : "Não"}
          </span>
        ),
      },
      {
        id: "trial",
        header: "Trial",
        cell: ({ row }) => (
          <span className="tabular-nums text-sm">
            {row.original.config?.trialDays ?? 14} dias
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.config?.ativo !== false ? "outline" : "secondary"
            }
          >
            {row.original.config?.ativo !== false ? "Ativa" : "Inativa"}
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
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/segmentos" className="hover:underline">
            Segmentos
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">{segment.name}</span>
        </div>

        <SegmentoEditForm segment={segment} canEdit={canEdit} />

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Fases do segmento</h2>
          <p className="text-sm text-muted-foreground">
            Clique em uma fase para {canEdit ? "editar" : "ver"} bundle, módulos,
            trial e regras de pagamento.
          </p>
        </div>
        <DataTable
          table={table}
          onRowClick={abrirFase}
          emptyMessage="Nenhuma fase configurada."
        />

        <div className="flex flex-col gap-2 border-t pt-6">
          <h2 className="text-lg font-semibold">Template de setores</h2>
          <p className="text-sm text-muted-foreground">
            Setores provisionados por fase (signup e expansão). Seed via{" "}
            <code className="text-xs">segment-sector-templates.json</code>.
          </p>
          {sectorTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum template — execute db:seed-roadmap.
            </p>
          ) : (
            <ul className="grid gap-2 text-sm md:grid-cols-2">
              {sectorTemplates.map((t) => (
                <li
                  key={t.sectorSlug}
                  className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
                >
                  <span className="font-medium">{t.displayName}</span>
                  <Badge variant="outline">P{t.phaseMin}+</Badge>
                  <Badge variant="secondary">{t.visibilityDefault}</Badge>
                  {t.isAggregator ? (
                    <Badge variant="secondary">Agregador</Badge>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {t.sectorSlug} · {t.coreSectorSlug}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Módulos por setor (template)</h2>
          {moduleTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum vínculo.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {moduleTemplates.map((m) => (
                <li key={`${m.moduleId}-${m.coreSectorSlug}`} className="font-mono text-xs">
                  {m.moduleId} → {m.coreSectorSlug}
                  {m.shortcutCoreSectorSlugs.length > 0
                    ? ` (atalho: ${m.shortcutCoreSectorSlugs.join(", ")})`
                    : ""}
                  <span className="text-muted-foreground"> · P{m.phaseMin}+</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <SegmentPhaseEditDialog
        segmentSlug={segment.slug}
        segmentName={segment.name}
        phase={phaseEmEdicao?.phase ?? null}
        config={phaseEmEdicao?.config ?? null}
        modules={modules}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        canEdit={canEdit}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
