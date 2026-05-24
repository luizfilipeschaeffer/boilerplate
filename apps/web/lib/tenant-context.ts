import { auth } from "@/auth";
import { assertActiveMembership } from "@boilerplate/db";

export async function requireTenantContext() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Não autenticado");
  if (session?.needsOnboarding) {
    throw new Error("Organização não disponível");
  }

  const membership = await assertActiveMembership(userId, {
    sectorId: session?.sectorId,
    branchId: session?.branchId,
  });

  return {
    organizationId: membership.organizationId,
    schemaName: membership.schemaName,
    branchId: session?.branchId ?? membership.branchId ?? null,
    sectorId: session?.sectorId ?? "geral",
    role: membership.role,
    userId,
  };
}
