import { persistDomainEvent } from "../domain-events";
import { prisma } from "../client";
import { assertSafeSchemaName } from "./schema";

export type MissionCounts = {
  clients: number;
  catalog: number;
  sales: number;
};

function missionsTable(schemaName: string): string {
  assertSafeSchemaName(schemaName);
  return `"${schemaName}"."missoes"`;
}

export async function getTenantMissionCounts(
  schemaName: string,
): Promise<MissionCounts> {
  assertSafeSchemaName(schemaName);
  const schema = schemaName;

  const [clients, catalog, sales] = await Promise.all([
    prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*)::bigint AS count FROM "${schema}"."clients" WHERE active = true`,
    ),
    prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*)::bigint AS count FROM "${schema}"."catalog_items" WHERE active = true`,
    ),
    prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*)::bigint AS count FROM "${schema}"."sales"`,
    ),
  ]);

  return {
    clients: Number(clients[0]?.count ?? 0),
    catalog: Number(catalog[0]?.count ?? 0),
    sales: Number(sales[0]?.count ?? 0),
  };
}

export async function listCompletedMissionIds(
  schemaName: string,
): Promise<string[]> {
  assertSafeSchemaName(schemaName);
  const table = missionsTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<{ mission_id: string }[]>(
    `SELECT mission_id FROM ${table} ORDER BY completed_at ASC`,
  );
  return rows.map((r) => r.mission_id);
}

export async function isMissionCompleted(
  schemaName: string,
  missionId: string,
): Promise<boolean> {
  assertSafeSchemaName(schemaName);
  const table = missionsTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<{ mission_id: string }[]>(
    `SELECT mission_id FROM ${table} WHERE mission_id = $1`,
    missionId,
  );
  return rows.length > 0;
}

export async function completeTenantMission(input: {
  schemaName: string;
  organizationId: string;
  missionId: string;
  source: "auto" | "visit";
}): Promise<boolean> {
  const already = await isMissionCompleted(
    input.schemaName,
    input.missionId,
  );
  if (already) return false;

  assertSafeSchemaName(input.schemaName);
  const table = missionsTable(input.schemaName);
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${table} (mission_id, completed_at, source)
     VALUES ($1, NOW(), $2)
     ON CONFLICT (mission_id) DO NOTHING`,
    input.missionId,
    input.source,
  );

  const nowCompleted = await isMissionCompleted(
    input.schemaName,
    input.missionId,
  );
  if (!nowCompleted) return false;

  await persistDomainEvent({
    organizationId: input.organizationId,
    eventType: "missao.concluida",
    payload: {
      missionId: input.missionId,
      source: input.source,
    },
  });

  return true;
}

/** Sincroniza missões baseadas em dados e retorna ids concluídos. */
export async function syncDataMissions(input: {
  schemaName: string;
  organizationId: string;
  rules: { missionId: string; dataKey: keyof MissionCounts }[];
}): Promise<string[]> {
  const counts = await getTenantMissionCounts(input.schemaName);
  const completed = await listCompletedMissionIds(input.schemaName);
  const done = new Set(completed);

  for (const rule of input.rules) {
    if (done.has(rule.missionId)) continue;
    if (counts[rule.dataKey] > 0) {
      await completeTenantMission({
        schemaName: input.schemaName,
        organizationId: input.organizationId,
        missionId: rule.missionId,
        source: "auto",
      });
      done.add(rule.missionId);
    }
  }

  return [...done];
}
