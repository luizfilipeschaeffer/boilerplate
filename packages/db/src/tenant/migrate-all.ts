import { prisma } from "../client";
import { provisionTenantSchema } from "./provision";

/** Aplica DDL/migrations em todos os schemas tenant (dev após atualizar provision). */
export async function migrateAllTenantSchemas(): Promise<number> {
  const orgs = await prisma.organization.findMany({
    select: { schemaName: true },
  });
  for (const org of orgs) {
    await provisionTenantSchema(org.schemaName);
  }
  return orgs.length;
}
