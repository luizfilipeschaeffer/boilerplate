"use client";

import type {
  CrmBoardRecord,
  CrmNote,
  CrmPipelineStage,
  CrmRecordKind,
  CreateLeadInput,
} from "@boilerplate/crm";
import type { Fase } from "@boilerplate/shared";
import {
  CRM_PIPELINE_STAGES,
  CRM_STAGE_LABELS,
  FASE_LABELS,
  FASES,
  formatTipoNegocio,
} from "@boilerplate/crm";
import { useCallback, useEffect, useState } from "react";

export function CrmRecordSheet({
  record,
  open,
  onClose,
  canEdit,
  moduleLabels,
  availableModuleIds,
  onLoadNotes,
  onAddNote,
  onUpdatePhase,
  onUpdateStage,
  onUpdateModules,
}: {
  record: CrmBoardRecord | null;
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  moduleLabels: Record<string, string>;
  availableModuleIds?: string[];
  onLoadNotes: (id: string, kind: CrmRecordKind) => Promise<CrmNote[]>;
  onAddNote: (id: string, kind: CrmRecordKind, body: string) => Promise<void>;
  onUpdatePhase: (id: string, kind: CrmRecordKind, phase: Fase) => Promise<void>;
  onUpdateStage: (
    id: string,
    kind: CrmRecordKind,
    stage: CrmPipelineStage,
  ) => Promise<void>;
  onUpdateModules?: (organizationId: string, moduleIds: string[]) => Promise<void>;
}) {
  const [tab, setTab] = useState<"resumo" | "modulos" | "notas">("resumo");
  const [notes, setNotes] = useState<CrmNote[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!record) return;
    setLoadingNotes(true);
    try {
      const list = await onLoadNotes(record.id, record.kind);
      setNotes(list);
    } finally {
      setLoadingNotes(false);
    }
  }, [record, onLoadNotes]);

  useEffect(() => {
    if (open && record) {
      setTab("resumo");
      setSelectedModules([...record.moduleIds]);
      void loadNotes();
    }
  }, [open, record, loadNotes]);

  if (!open || !record) return null;

  const showModules =
    record.kind === "organization" &&
    onUpdateModules &&
    availableModuleIds &&
    availableModuleIds.length > 0;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="font-semibold">{record.title}</h2>
            <p className="text-xs text-muted-foreground">
              {record.kind === "lead" ? "Lead" : "Organização"} ·{" "}
              {formatTipoNegocio(
                typeof record.meta.tipoNegocio === "string"
                  ? record.meta.tipoNegocio
                  : null,
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            Fechar
          </button>
        </div>

        <div className="flex gap-1 border-b px-4">
          {(
            [
              { id: "resumo" as const, label: "Resumo" },
              ...(showModules ? [{ id: "modulos" as const, label: "Módulos" }] : []),
              { id: "notas" as const, label: "Notas" },
            ]
          ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`border-b-2 px-3 py-2 text-sm ${
                  tab === t.id
                    ? "border-primary font-medium"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "resumo" ? (
            <div className="flex flex-col gap-4 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-muted-foreground">Fase</span>
                <select
                  className="rounded-md border bg-background px-2 py-1.5"
                  value={record.phase}
                  disabled={!canEdit || saving}
                  onChange={async (e) => {
                    const phase = Number(e.target.value) as Fase;
                    setSaving(true);
                    try {
                      await onUpdatePhase(record.id, record.kind, phase);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {FASES.map((f) => (
                    <option key={f} value={f}>
                      {FASE_LABELS[f]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-muted-foreground">Pipeline</span>
                <select
                  className="rounded-md border bg-background px-2 py-1.5"
                  value={record.pipelineStage}
                  disabled={!canEdit || saving}
                  onChange={async (e) => {
                    setSaving(true);
                    try {
                      await onUpdateStage(
                        record.id,
                        record.kind,
                        e.target.value as CrmPipelineStage,
                      );
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {CRM_PIPELINE_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {CRM_STAGE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              {record.meta.slug ? (
                <p>
                  <span className="text-muted-foreground">Slug: </span>
                  {String(record.meta.slug)}
                </p>
              ) : null}
              {record.meta.hasCnpj != null ? (
                <p>
                  <span className="text-muted-foreground">CNPJ: </span>
                  {record.meta.hasCnpj ? String(record.meta.cnpj ?? "Sim") : "Não"}
                </p>
              ) : null}
            </div>
          ) : null}

          {tab === "modulos" && showModules ? (
            <div className="flex flex-col gap-3">
              <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                {availableModuleIds!.map((id) => (
                  <label key={id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedModules.includes(id)}
                      disabled={!canEdit || saving}
                      onChange={(e) => {
                        setSelectedModules((prev) =>
                          e.target.checked
                            ? [...prev, id]
                            : prev.filter((m) => m !== id),
                        );
                      }}
                    />
                    {moduleLabels[id] ?? id}
                  </label>
                ))}
              </div>
              {canEdit ? (
                <button
                  type="button"
                  disabled={saving}
                  className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await onUpdateModules!(record.id, selectedModules);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Salvar módulos
                </button>
              ) : null}
            </div>
          ) : null}

          {tab === "notas" ? (
            <div className="flex flex-col gap-3">
              {loadingNotes ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma nota.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {notes.map((n) => (
                    <li
                      key={n.id}
                      className="rounded-md border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <p>{n.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {n.authorName ? `${n.authorName} · ` : ""}
                        {new Date(n.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {canEdit ? (
                <>
                  <textarea
                    className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Nova nota…"
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={!noteBody.trim() || saving}
                    className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await onAddNote(record.id, record.kind, noteBody.trim());
                        setNoteBody("");
                        await loadNotes();
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Adicionar nota
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}

export function CreateLeadForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: CreateLeadInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        try {
          await onSubmit({
            name: name.trim(),
            email: email.trim() || null,
          });
          setName("");
          setEmail("");
        } finally {
          setSaving(false);
        }
      }}
    >
      <input
        className="rounded-md border px-2 py-1 text-sm"
        placeholder="Nome *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="rounded-md border px-2 py-1 text-sm"
        placeholder="E-mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="flex-1 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
        >
          Criar lead
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-2 py-1 text-xs"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
