"use server";

import {
  completeTenantMission,
  syncDataMissions,
  listCompletedMissionIds,
} from "@boilerplate/db";
import { FASE1_MISSIONS, type MissionId } from "@/lib/missions/catalog";
import { requireTenantContext } from "@/lib/tenant-context";
import { revalidatePath } from "next/cache";

const DATA_RULES = FASE1_MISSIONS.filter((m) => m.dataKey).map((m) => ({
  missionId: m.id,
  dataKey: m.dataKey!,
}));

export async function syncAndLoadMissions(): Promise<{
  completedIds: string[];
}> {
  const { schemaName, organizationId } = await requireTenantContext();

  await syncDataMissions({
    schemaName,
    organizationId,
    rules: DATA_RULES,
  });

  const completedIds = await listCompletedMissionIds(schemaName);
  return { completedIds };
}

export async function markMissionVisit(missionId: MissionId): Promise<void> {
  const { schemaName, organizationId } = await requireTenantContext();
  const mission = FASE1_MISSIONS.find((m) => m.id === missionId);
  if (!mission || mission.kind !== "visit") return;

  await completeTenantMission({
    schemaName,
    organizationId,
    missionId,
    source: "visit",
  });

  revalidatePath("/dashboard");
}
