"use server";

import {
  completeTenantMission,
  findUserByEmailForAuth,
  syncDataMissions,
  listCompletedMissionIds,
} from "@boilerplate/db";
import { auth } from "@/auth";
import { FASE1_MISSIONS, type MissionId } from "@/lib/missions/catalog";
import { requireTenantContext } from "@/lib/tenant-context";
import { revalidatePath } from "next/cache";

const DATA_RULES = FASE1_MISSIONS.filter((m) => m.dataKey).map((m) => ({
  missionId: m.id,
  dataKey: m.dataKey!,
}));

const AUTH_MISSION_IDS = FASE1_MISSIONS.filter((m) => m.authKey).map(
  (m) => m.id,
);

async function syncAuthMissions(
  schemaName: string,
  organizationId: string,
): Promise<void> {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return;

  const user = await findUserByEmailForAuth(email);
  if (!user?.passwordHash) return;

  for (const missionId of AUTH_MISSION_IDS) {
    await completeTenantMission({
      schemaName,
      organizationId,
      missionId,
      source: "auto",
    });
  }
}

export async function syncAndLoadMissions(): Promise<{
  completedIds: string[];
}> {
  const { schemaName, organizationId } = await requireTenantContext();

  await syncAuthMissions(schemaName, organizationId);

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
