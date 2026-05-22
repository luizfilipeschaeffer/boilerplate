"use client";

import type { ModuleDefinition } from "@boilerplate/shared";
import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ModulosPickerDisplayMode = "badges" | "list";

export function ModulosBadgePicker({
  modules,
  selectedIds,
  onSelectedChange,
  canEdit,
  label = "Módulos do bundle",
  availableFirst = false,
  selectedTitle = "Selecionados",
  availableTitle = "Disponíveis",
  displayMode = "badges",
}: {
  modules: ModuleDefinition[];
  selectedIds: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
  canEdit: boolean;
  label?: string;
  availableFirst?: boolean;
  selectedTitle?: string;
  availableTitle?: string;
  displayMode?: ModulosPickerDisplayMode;
}) {
  const [filtro, setFiltro] = useState("");

  const sorted = useMemo(
    () => [...modules].sort((a, b) => a.name.localeCompare(b.name)),
    [modules],
  );

  const { selecionados, disponiveis } = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    const match = (m: ModuleDefinition) =>
      !q ||
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q);

    const sel: ModuleDefinition[] = [];
    const disp: ModuleDefinition[] = [];
    for (const m of sorted) {
      if (!match(m)) continue;
      if (selectedIds.has(m.id)) sel.push(m);
      else disp.push(m);
    }
    return { selecionados: sel, disponiveis: disp };
  }, [sorted, selectedIds, filtro]);

  function adicionar(moduleId: string) {
    if (!canEdit) return;
    const next = new Set(selectedIds);
    next.add(moduleId);
    onSelectedChange(next);
  }

  function remover(moduleId: string) {
    if (!canEdit) return;
    const next = new Set(selectedIds);
    next.delete(moduleId);
    onSelectedChange(next);
  }

  const Panel = displayMode === "list" ? ModuloListPanel : ModuloBadgePanel;

  const selectedPanel = (
    <Panel
      title={selectedTitle}
      emptyText={
        canEdit
          ? availableFirst
            ? "Clique nos módulos à esquerda para habilitar."
            : "Clique nos módulos à direita para adicionar."
          : availableFirst
            ? "Nenhum módulo habilitado nesta fase."
            : "Nenhum módulo selecionado."
      }
      modules={selecionados}
      variant="selected"
      canEdit={canEdit}
      onModuleClick={remover}
    />
  );

  const availablePanel = (
    <Panel
      title={availableTitle}
      emptyText={
        availableFirst
          ? "Todos os módulos já foram habilitados."
          : "Todos os módulos já foram selecionados."
      }
      modules={disponiveis}
      variant="available"
      canEdit={canEdit}
      onModuleClick={adicionar}
    />
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">
          {selectedIds.size}{" "}
          {selectedIds.size === 1 ? "selecionado" : "selecionados"}
        </span>
      </div>
      <Input
        placeholder="Filtrar módulos…"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {availableFirst ? (
          <>
            {availablePanel}
            {selectedPanel}
          </>
        ) : (
          <>
            {selectedPanel}
            {canEdit ? availablePanel : null}
          </>
        )}
      </div>
    </div>
  );
}

type PanelProps = {
  title: string;
  emptyText: string;
  modules: ModuleDefinition[];
  variant: "selected" | "available";
  canEdit: boolean;
  onModuleClick: (moduleId: string) => void;
};

function ModuloListPanel({
  title,
  emptyText,
  modules,
  variant,
  canEdit,
  onModuleClick,
}: PanelProps) {
  return (
    <div
      className={cn(
        "flex min-h-[200px] flex-col rounded-xl border",
        variant === "selected" ? "bg-muted/30" : "bg-background",
      )}
    >
      <div className="border-b px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">
          {title}
          <span className="ml-1.5 tabular-nums">({modules.length})</span>
        </p>
      </div>
      {modules.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-3 py-6 text-center text-xs text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <ul className="max-h-[min(280px,40vh)] overflow-y-auto py-1">
          {modules.map((mod) => (
            <li key={mod.id}>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => onModuleClick(mod.id)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  canEdit && "hover:bg-muted/80",
                  !canEdit && "cursor-default",
                  variant === "selected" && canEdit && "hover:bg-primary/10",
                )}
              >
                {canEdit ? (
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md border",
                      variant === "selected"
                        ? "border-primary/30 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {variant === "selected" ? (
                      <Minus className="size-3.5" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium leading-tight">
                    {mod.name}
                  </span>
                  <span className="block truncate font-mono text-xs text-muted-foreground">
                    {mod.id}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ModuloBadgePanel({
  title,
  emptyText,
  modules,
  variant,
  canEdit,
  onModuleClick,
}: PanelProps) {
  return (
    <div
      className={cn(
        "flex min-h-[140px] flex-col rounded-xl border p-3",
        variant === "selected" ? "bg-muted/30" : "bg-background",
      )}
    >
      <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      {modules.length === 0 ? (
        <p className="flex flex-1 items-center text-center text-xs text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {modules.map((mod) => (
            <button
              key={mod.id}
              type="button"
              disabled={!canEdit}
              title={`${mod.name} (${mod.id})`}
              onClick={() => onModuleClick(mod.id)}
              className={cn(
                "inline-flex max-w-full rounded-3xl border text-left transition-colors",
                canEdit && "cursor-pointer hover:opacity-90",
                !canEdit && "cursor-default",
                variant === "selected"
                  ? "border-primary/30 bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-secondary-foreground hover:bg-muted",
              )}
            >
              <span className="flex flex-col gap-0 px-2.5 py-1">
                <span className="truncate text-xs font-medium leading-tight">
                  {mod.name}
                </span>
                <span
                  className={cn(
                    "truncate font-mono text-[10px] leading-tight",
                    variant === "selected"
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground",
                  )}
                >
                  {mod.id}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
