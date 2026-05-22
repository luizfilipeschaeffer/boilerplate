import type { CrmRecordKind, CrmTimelineEntry } from "@boilerplate/crm";
import {
  formatTimelineEventBody,
  labelForCrmEventType,
  mergeTimelineEntries,
} from "@boilerplate/crm";
import { listCrmDomainEventsForRecord } from "../domain-events";
import { createTenantCrmRepository } from "./tenant-repository";

const ACTIVITY_TITLES: Record<string, string> = {
  note: "Nota",
  call: "Ligação",
  meeting: "Reunião",
  stage_change: "Etapa alterada",
  message: "Mensagem",
};

export async function listTenantCrmTimeline(
  schemaName: string,
  organizationId: string,
  id: string,
  kind: CrmRecordKind,
): Promise<CrmTimelineEntry[]> {
  const repo = createTenantCrmRepository(schemaName);
  const notes = await repo.listNotes(id, kind);

  const { prisma } = await import("../client");
  const { assertSafeSchemaName } = await import("../tenant/schema");
  assertSafeSchemaName(schemaName);
  const s = schemaName;
  const activityTable = `"${s}"."crm_activity"`;
  const dealTable = `"${s}"."crm_deal"`;

  const activityWhere =
    kind === "lead"
      ? `crm_lead_id = $1`
      : `client_id IN (SELECT client_id FROM ${dealTable} WHERE id = $1 AND client_id IS NOT NULL)`;

  type ActivityRow = {
    id: string;
    activity_type: string;
    body: string | null;
    created_at: Date;
  };

  const activities = await prisma.$queryRawUnsafe<ActivityRow[]>(
    `SELECT id, activity_type, body, created_at
     FROM ${activityTable}
     WHERE ${activityWhere}
     ORDER BY created_at DESC
     LIMIT 40`,
    id,
  );

  const events = await listCrmDomainEventsForRecord(organizationId, id);

  const entries: CrmTimelineEntry[] = [
    ...notes.map((n) => ({
      id: `note:${n.id}`,
      kind: "note" as const,
      title: "Nota",
      body: n.body,
      createdAt: n.createdAt,
      authorName: n.authorName,
    })),
    ...activities.map((a) => ({
      id: `activity:${a.id}`,
      kind: "activity" as const,
      title: ACTIVITY_TITLES[a.activity_type] ?? a.activity_type,
      body: a.body,
      createdAt: a.created_at,
      authorName: null,
    })),
    ...events.map((e) => ({
      id: `event:${e.id}`,
      kind: "event" as const,
      title: labelForCrmEventType(e.eventType),
      body: formatTimelineEventBody(e.eventType, e.payload),
      createdAt: e.createdAt,
      authorName: null,
    })),
  ];

  return mergeTimelineEntries(entries);
}
