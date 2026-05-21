"use client";

import type { CrmBoardRecord } from "@boilerplate/crm";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { CrmRecordCard } from "./crm-record-card";

function KanbanColumn({
  id,
  title,
  count,
  children,
  footer,
}: {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[260px] max-w-[320px] flex-1 flex-col rounded-xl border bg-muted/30 ${
        isOver ? "ring-2 ring-primary/40" : ""
      }`}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2 min-h-[120px] max-h-[calc(100vh-16rem)]">
        {children}
      </div>
      {footer ? <div className="border-t p-2">{footer}</div> : null}
    </div>
  );
}

export function CrmKanban({
  columns,
  moduleLabels,
  canEdit,
  onOpenRecord,
  onDrop,
  leadColumnFooter,
}: {
  columns: { id: string; title: string; records: CrmBoardRecord[] }[];
  moduleLabels: Record<string, string>;
  canEdit: boolean;
  onOpenRecord: (record: CrmBoardRecord) => void;
  onDrop: (record: CrmBoardRecord, columnId: string) => Promise<void>;
  leadColumnFooter?: React.ReactNode;
}) {
  const [active, setActive] = useState<CrmBoardRecord | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const record = event.active.data.current?.record as
      | CrmBoardRecord
      | undefined;
    setActive(record ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActive(null);
    const record = event.active.data.current?.record as
      | CrmBoardRecord
      | undefined;
    const columnId = event.over?.id;
    if (!record || !columnId || typeof columnId !== "string") return;
    if (!canEdit) return;
    await onDrop(record, columnId);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            count={col.records.length}
            footer={col.id === "lead" ? leadColumnFooter : undefined}
          >
            {col.records.length === 0 ? (
              <p className="px-1 py-4 text-center text-xs text-muted-foreground">
                Vazio
              </p>
            ) : (
              col.records.map((record) => (
                <CrmRecordCard
                  key={`${record.kind}:${record.id}`}
                  record={record}
                  moduleLabels={moduleLabels}
                  canEdit={canEdit}
                  onOpen={() => onOpenRecord(record)}
                />
              ))
            )}
          </KanbanColumn>
        ))}
      </div>
      <DragOverlay>
        {active ? (
          <div className="w-[280px]">
            <CrmRecordCard
              record={active}
              moduleLabels={moduleLabels}
              canEdit={false}
              onOpen={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
