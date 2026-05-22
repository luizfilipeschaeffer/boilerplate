"use client";

import type {
  CrmLeadDetail,
  CrmLeadDuplicate,
  CrmLeadStatus,
  UpdateLeadInput,
} from "@boilerplate/crm";
import {
  CRM_LEAD_STATUSES,
  CRM_LEAD_STATUS_LABELS,
} from "@boilerplate/crm";
import { useEffect, useState } from "react";

export function CrmLeadDetailPanel({
  leadId,
  canEdit,
  loadDetail,
  loadDuplicates,
  loadOwners,
  onSave,
  onMerge,
}: {
  leadId: string;
  canEdit: boolean;
  loadDetail: (id: string) => Promise<CrmLeadDetail>;
  loadDuplicates: (id: string) => Promise<CrmLeadDuplicate[]>;
  loadOwners: () => Promise<{ userId: string; name: string }[]>;
  onSave: (id: string, input: UpdateLeadInput) => Promise<void>;
  onMerge: (targetId: string, sourceId: string) => Promise<void>;
}) {
  const [detail, setDetail] = useState<CrmLeadDetail | null>(null);
  const [duplicates, setDuplicates] = useState<CrmLeadDuplicate[]>([]);
  const [owners, setOwners] = useState<{ userId: string; name: string }[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      loadDetail(leadId),
      loadDuplicates(leadId),
      loadOwners(),
    ])
      .then(([d, dup, own]) => {
        if (!cancelled) {
          setDetail(d);
          setDuplicates(dup);
          setOwners(own);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [leadId, loadDetail, loadDuplicates, loadOwners]);

  if (loading || !detail) {
    return (
      <p className="text-sm text-muted-foreground">Carregando lead…</p>
    );
  }

  function patch(partial: Partial<CrmLeadDetail>) {
    setDetail((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  async function handleSave() {
    if (!detail) return;
    setSaving(true);
    try {
      await onSave(leadId, {
        name: detail.name,
        email: detail.email,
        phone: detail.phone,
        cnpj: detail.cnpj,
        status: detail.status,
        source: detail.source,
        ownerUserId: detail.ownerUserId,
        notes: detail.notes,
        tags: detail.tags,
        utm: detail.utm,
      });
    } finally {
      setSaving(false);
    }
  }

  function addTag() {
    const t = tagInput.trim();
    if (!detail || !t || detail.tags.includes(t)) return;
    patch({ tags: [...detail.tags, t] });
    setTagInput("");
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      {duplicates.length > 0 ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="font-medium text-amber-900 dark:text-amber-100">
            Possíveis duplicados ({duplicates.length})
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {duplicates.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  {d.name}
                  {d.email ? ` · ${d.email}` : ""}
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    ({d.matchReason})
                  </span>
                </span>
                {canEdit ? (
                  <button
                    type="button"
                    className="rounded border px-2 py-0.5 text-xs hover:bg-muted"
                    disabled={saving}
                    onClick={async () => {
                      if (
                        !confirm(
                          `Mesclar "${d.name}" neste lead? O outro registro será removido.`,
                        )
                      ) {
                        return;
                      }
                      setSaving(true);
                      try {
                        await onMerge(leadId, d.id);
                        const [fresh, dup] = await Promise.all([
                          loadDetail(leadId),
                          loadDuplicates(leadId),
                        ]);
                        setDetail(fresh);
                        setDuplicates(dup);
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Mesclar aqui
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground">Nome</span>
        <input
          className="rounded-md border px-2 py-1.5"
          value={detail.name}
          disabled={!canEdit}
          onChange={(e) => patch({ name: e.target.value })}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">E-mail</span>
          <input
            className="rounded-md border px-2 py-1.5"
            type="email"
            value={detail.email ?? ""}
            disabled={!canEdit}
            onChange={(e) =>
              patch({ email: e.target.value || null })
            }
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Telefone</span>
          <input
            className="rounded-md border px-2 py-1.5"
            value={detail.phone ?? ""}
            disabled={!canEdit}
            onChange={(e) =>
              patch({ phone: e.target.value || null })
            }
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground">CNPJ</span>
        <input
          className="rounded-md border px-2 py-1.5"
          value={detail.cnpj ?? ""}
          disabled={!canEdit}
          onChange={(e) => patch({ cnpj: e.target.value || null })}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Status</span>
          <select
            className="rounded-md border px-2 py-1.5"
            value={detail.status}
            disabled={!canEdit}
            onChange={(e) =>
              patch({ status: e.target.value as CrmLeadStatus })
            }
          >
            {CRM_LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CRM_LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Origem</span>
          <input
            className="rounded-md border px-2 py-1.5"
            placeholder="Site, indicação, feira…"
            value={detail.source ?? ""}
            disabled={!canEdit}
            onChange={(e) =>
              patch({ source: e.target.value || null })
            }
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground">Proprietário</span>
        <select
          className="rounded-md border px-2 py-1.5"
          value={detail.ownerUserId ?? ""}
          disabled={!canEdit}
          onChange={(e) =>
            patch({
              ownerUserId: e.target.value || null,
              ownerName:
                owners.find((o) => o.userId === e.target.value)?.name ?? null,
            })
          }
        >
          <option value="">Sem proprietário</option>
          {owners.map((o) => (
            <option key={o.userId} value={o.userId}>
              {o.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground">Tags</span>
        <div className="flex flex-wrap gap-1">
          {detail.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              {tag}
              {canEdit ? (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    patch({ tags: detail.tags.filter((t) => t !== tag) })
                  }
                >
                  ×
                </button>
              ) : null}
            </span>
          ))}
        </div>
        {canEdit ? (
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border px-2 py-1.5"
              placeholder="Nova tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <button
              type="button"
              className="rounded-md border px-2 py-1 text-xs"
              onClick={addTag}
            >
              Adicionar
            </button>
          </div>
        ) : null}
      </div>

      <fieldset className="rounded-md border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">
          UTMs
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              ["source", "Origem"],
              ["medium", "Mídia"],
              ["campaign", "Campanha"],
              ["term", "Termo"],
              ["content", "Conteúdo"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{label}</span>
              <input
                className="rounded-md border px-2 py-1 text-xs"
                value={detail.utm[key] ?? ""}
                disabled={!canEdit}
                onChange={(e) =>
                  patch({
                    utm: { ...detail.utm, [key]: e.target.value || null },
                  })
                }
              />
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground">Observações</span>
        <textarea
          className="min-h-[72px] rounded-md border px-2 py-1.5"
          value={detail.notes ?? ""}
          disabled={!canEdit}
          onChange={(e) => patch({ notes: e.target.value || null })}
        />
      </label>

      {canEdit ? (
        <button
          type="button"
          disabled={saving}
          className="rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
          onClick={() => void handleSave()}
        >
          Salvar lead
        </button>
      ) : null}
    </div>
  );
}
