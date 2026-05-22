import { auth } from "@/auth";
import { getOrganizationById } from "@boilerplate/db";

export async function requireTenantContext() {
  const session = await auth();
  if (!session?.organizationId || session.needsOnboarding) {
    throw new Error("Organização não disponível");
  }
  const org = await getOrganizationById(session.organizationId);
  if (!org) throw new Error("Organização não encontrada");
  return {
    organizationId: org.id,
    schemaName: org.schemaName,
    branchId: session.branchId ?? null,
    sectorId: session.sectorId ?? "geral",
    role: session.role ?? "dono",
  };
}
