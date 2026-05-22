import { listOrganizationIdsForUserEmail } from "@boilerplate/db";
import { revalidatePath } from "next/cache";

/** Atualiza cache de listagens após membro definir senha. */
export async function revalidateMemberPagesForEmail(email: string) {
  const orgIds = await listOrganizationIdsForUserEmail(email);
  if (orgIds.length === 0) return;
  revalidatePath("/configuracoes/membros");
}
