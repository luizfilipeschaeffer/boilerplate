"use client";

import type { CrmBoardRecord } from "@boilerplate/crm";
import {
  CRM_STAGE_LABELS,
  FASE_LABELS,
  formatTipoNegocio,
} from "@boilerplate/crm";

export function CrmListView({
  records,
  moduleLabels,
  onOpenRecord,
}: {
  records: CrmBoardRecord[];
  moduleLabels: Record<string, string>;
  onOpenRecord: (record: CrmBoardRecord) => void;
}) {
  if (records.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum registro no CRM.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-3 py-2 font-medium">Nome</th>
            <th className="px-3 py-2 font-medium">Tipo</th>
            <th className="px-3 py-2 font-medium">Fase</th>
            <th className="px-3 py-2 font-medium">Pipeline</th>
            <th className="px-3 py-2 font-medium text-right">Membros</th>
            <th className="px-3 py-2 font-medium">Módulos</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr
              key={`${record.kind}:${record.id}`}
              className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
              onClick={() => onOpenRecord(record)}
            >
              <td className="px-3 py-2 font-medium">
                {record.title}
                {record.kind === "lead" ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (lead)
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {formatTipoNegocio(
                  typeof record.meta.tipoNegocio === "string"
                    ? record.meta.tipoNegocio
                    : null,
                )}
              </td>
              <td className="px-3 py-2">{FASE_LABELS[record.phase]}</td>
              <td className="px-3 py-2">
                {CRM_STAGE_LABELS[record.pipelineStage]}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {record.kind === "organization" &&
                record.meta.memberCount != null
                  ? String(record.meta.memberCount)
                  : "—"}
              </td>
              <td className="px-3 py-2">
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {record.moduleIds
                    .slice(0, 4)
                    .map((id) => moduleLabels[id] ?? id)
                    .join(", ") || "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
