"use client";

import type { CrmBoardRecord } from "@boilerplate/crm";
import { activityTypeLabel } from "@boilerplate/db";
import { useCallback, useEffect, useState } from "react";
import {
  addCrmActivityAction,
  addCrmContactAction,
  linkLeadToOrgAction,
  loadCrmActivitiesAction,
  loadCrmContactsAction,
} from "./actions";

export function CrmRecordExtras({
  record,
  canEdit,
  organizations = [],
}: {
  record: CrmBoardRecord;
  canEdit: boolean;
  organizations?: { id: string; name: string }[];
}) {
  const [linkOrgId, setLinkOrgId] = useState("");
  const [contacts, setContacts] = useState<
    Awaited<ReturnType<typeof loadCrmContactsAction>>
  >([]);
  const [activities, setActivities] = useState<
    Awaited<ReturnType<typeof loadCrmActivitiesAction>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [activityBody, setActivityBody] = useState("");
  const [activityType, setActivityType] = useState<"call" | "meeting" | "note">(
    "call",
  );
  const [saving, setSaving] = useState(false);

  const recordKey = `${record.id}:${record.kind}`;
  const [prevRecordKey, setPrevRecordKey] = useState(recordKey);
  if (recordKey !== prevRecordKey) {
    setPrevRecordKey(recordKey);
    setLoading(true);
  }

  const reload = useCallback(async () => {
    const [c, a] = await Promise.all([
      loadCrmContactsAction(record.id, record.kind),
      loadCrmActivitiesAction(record.id, record.kind),
    ]);
    setContacts(c);
    setActivities(a);
  }, [record.id, record.kind]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      loadCrmContactsAction(record.id, record.kind),
      loadCrmActivitiesAction(record.id, record.kind),
    ]).then(([c, a]) => {
      if (!cancelled) {
        setContacts(c);
        setActivities(a);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [record.id, record.kind]);

  return (
    <div className="flex flex-col gap-4 text-sm">
      {record.kind === "lead" && canEdit && organizations.length > 0 ? (
        <div className="rounded-md border border-dashed p-2">
          <h3 className="font-medium">Converter em trial</h3>
          <p className="mb-2 text-xs text-muted-foreground">
            Vincula o lead a uma organização existente e move conversas/notas.
          </p>
          <select
            className="mb-2 w-full rounded-md border px-2 py-1 text-sm"
            value={linkOrgId}
            onChange={(e) => setLinkOrgId(e.target.value)}
          >
            <option value="">Selecione a organização</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!linkOrgId || saving}
            className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
            onClick={async () => {
              setSaving(true);
              try {
                await linkLeadToOrgAction(record.id, linkOrgId);
                setLinkOrgId("");
              } finally {
                setSaving(false);
              }
            }}
          >
            Vincular lead
          </button>
        </div>
      ) : null}
      <div>
        <h3 className="font-medium">Contatos</h3>
        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : contacts.length === 0 ? (
          <p className="text-muted-foreground">Nenhum contato cadastrado.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {contacts.map((c) => (
              <li key={c.id} className="rounded-md border px-2 py-1.5">
                <span className="font-medium">{c.name}</span>
                {c.role ? (
                  <span className="text-muted-foreground"> · {c.role}</span>
                ) : null}
                {c.email ? (
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {canEdit ? (
          <form
            className="mt-2 flex flex-col gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!name.trim()) return;
              setSaving(true);
              try {
                await addCrmContactAction(record.id, record.kind, {
                  name: name.trim(),
                  email: email.trim() || undefined,
                });
                setName("");
                setEmail("");
                await reload();
              } finally {
                setSaving(false);
              }
            }}
          >
            <input
              className="rounded-md border px-2 py-1 text-sm"
              placeholder="Nome do contato"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="rounded-md border px-2 py-1 text-sm"
              placeholder="E-mail (opcional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-2 py-1.5 text-xs text-primary-foreground disabled:opacity-50"
            >
              Adicionar contato
            </button>
          </form>
        ) : null}
      </div>

      <div>
        <h3 className="font-medium">Atividades</h3>
        {loading ? null : activities.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma atividade.</p>
        ) : (
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {activities.slice(0, 8).map((a) => (
              <li key={a.id} className="rounded-md border px-2 py-1.5 text-xs">
                <span className="font-medium">
                  {activityTypeLabel(a.activityType)}
                </span>
                <p className="line-clamp-2">{a.body}</p>
              </li>
            ))}
          </ul>
        )}
        {canEdit ? (
          <form
            className="mt-2 flex flex-col gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!activityBody.trim()) return;
              setSaving(true);
              try {
                await addCrmActivityAction(record.id, record.kind, {
                  activityType,
                  body: activityBody.trim(),
                });
                setActivityBody("");
                await reload();
              } finally {
                setSaving(false);
              }
            }}
          >
            <select
              className="rounded-md border px-2 py-1 text-sm"
              value={activityType}
              onChange={(e) =>
                setActivityType(e.target.value as "call" | "meeting" | "note")
              }
            >
              <option value="call">Ligação</option>
              <option value="meeting">Reunião</option>
              <option value="note">Nota interna</option>
            </select>
            <textarea
              className="min-h-[60px] rounded-md border px-2 py-1 text-sm"
              placeholder="Resumo da atividade"
              value={activityBody}
              onChange={(e) => setActivityBody(e.target.value)}
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-md border px-2 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
            >
              Registrar atividade
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
