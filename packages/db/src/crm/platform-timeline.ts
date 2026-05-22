import type { CrmRecordKind, CrmTimelineEntry } from "@boilerplate/crm";
import { mergeTimelineEntries } from "@boilerplate/crm";
import { activityTypeLabel, listActivitiesForRecord } from "../platform-crm-ext";
import { createPlatformCrmRepository } from "./platform-repository";

export async function listPlatformCrmTimeline(
  id: string,
  kind: CrmRecordKind,
): Promise<CrmTimelineEntry[]> {
  const repo = createPlatformCrmRepository();
  const [notes, activities] = await Promise.all([
    repo.listNotes(id, kind),
    listActivitiesForRecord(id, kind),
  ]);

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
      title: activityTypeLabel(a.activityType),
      body: a.body,
      createdAt: a.createdAt,
      authorName: a.authorName,
    })),
  ];

  return mergeTimelineEntries(entries);
}
