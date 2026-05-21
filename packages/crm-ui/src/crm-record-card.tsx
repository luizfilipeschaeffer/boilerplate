"use client";

import type { CrmBoardRecord } from "@boilerplate/crm";
import {
  CRM_STAGE_LABELS,
  FASE_LABELS,
  formatTipoNegocio,
} from "@boilerplate/crm";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export function CrmRecordCard({
  record,
  moduleLabels,
  canEdit,
  onOpen,
}: {
  record: CrmBoardRecord;
  moduleLabels: Record<string, string>;
  canEdit: boolean;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${record.kind}:${record.id}`,
      data: { record },
      disabled: !canEdit,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const memberCount = record.meta.memberCount;
  const tipo =
    typeof record.meta.tipoNegocio === "string"
      ? formatTipoNegocio(record.meta.tipoNegocio)
      : record.subtitle;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card p-3 text-card-foreground shadow-sm ${
        isDragging ? "opacity-60 ring-2 ring-primary" : ""
      } ${canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
      {...(canEdit ? { ...listeners, ...attributes } : {})}
      onClick={(e) => {
        if (isDragging) return;
        onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-col gap-2">
        <div>
          <p className="font-medium leading-tight">{record.title}</p>
          {tipo ? (
            <p className="text-xs text-muted-foreground">{tipo}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs">
            {FASE_LABELS[record.phase]}
          </span>
          <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs">
            {CRM_STAGE_LABELS[record.pipelineStage]}
          </span>
          {record.kind === "lead" ? (
            <span className="inline-flex items-center rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground">
              Lead
            </span>
          ) : null}
        </div>
        {record.moduleIds.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {record.moduleIds.slice(0, 3).map((id) => (
              <span
                key={id}
                className="inline-flex max-w-[8rem] truncate rounded-md bg-muted px-1.5 py-0.5 text-[10px]"
                title={id}
              >
                {moduleLabels[id] ?? id}
              </span>
            ))}
            {record.moduleIds.length > 3 ? (
              <span className="text-[10px] text-muted-foreground">
                +{record.moduleIds.length - 3}
              </span>
            ) : null}
          </div>
        ) : null}
        {memberCount != null && record.kind === "organization" ? (
          <p className="text-xs text-muted-foreground tabular-nums">
            {String(memberCount)} membro
            {Number(memberCount) === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
