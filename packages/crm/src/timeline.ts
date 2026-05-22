export type CrmTimelineEntryKind = "note" | "activity" | "event";

export interface CrmTimelineEntry {
  id: string;
  kind: CrmTimelineEntryKind;
  title: string;
  body?: string | null;
  createdAt: Date;
  authorName?: string | null;
}

const CRM_EVENT_LABELS: Record<string, string> = {
  "crm.lead.criado": "Lead criado",
  "crm.deal.criado": "Oportunidade criada",
  "crm.deal.etapa_alterada": "Etapa alterada",
  "crm.nota.criada": "Nota adicionada",
};

export function labelForCrmEventType(eventType: string): string {
  return CRM_EVENT_LABELS[eventType] ?? eventType;
}

export function mergeTimelineEntries(
  entries: CrmTimelineEntry[],
): CrmTimelineEntry[] {
  return [...entries].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export function formatTimelineEventBody(
  eventType: string,
  payload: Record<string, unknown>,
): string | null {
  if (eventType === "crm.deal.etapa_alterada") {
    const from = payload.from;
    const to = payload.to;
    if (from != null && to != null) {
      return `${String(from)} → ${String(to)}`;
    }
  }
  if (eventType === "crm.lead.criado" && payload.name) {
    return String(payload.name);
  }
  if (eventType === "crm.deal.criado" && payload.clientId) {
    return `Cliente ${String(payload.clientId).slice(0, 8)}…`;
  }
  return null;
}
