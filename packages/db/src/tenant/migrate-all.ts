import { prisma } from "../client";
import { getActiveModuleIdsForOrg } from "../organization";
import { runModuleMigrationsForTenant } from "../module-migrations";
import { provisionTenantSchema } from "./provision";

/** Aplica DDL/migrations em todos os schemas tenant (dev após atualizar provision). */
export async function migrateAllTenantSchemas(): Promise<number> {
  const orgs = await prisma.organization.findMany({
    select: { id: true, schemaName: true },
  });
  for (const org of orgs) {
    await provisionTenantSchema(org.schemaName);
    const activeModuleIds = await getActiveModuleIdsForOrg(org.id);
    await runModuleMigrationsForTenant({
      schemaName: org.schemaName,
      organizationId: org.id,
      activeModuleIds,
    });
  }
  return orgs.length;
}
