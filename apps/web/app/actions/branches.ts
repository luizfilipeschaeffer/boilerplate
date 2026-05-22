"use server";

import { auth } from "@/auth";
import {
  createBranch,
  listBranches,
  updateBranch,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

async function requireOrgId() {
  const session = await auth();
  const orgId = session?.organizationId;
  if (!orgId) throw new Error("Organização não disponível");
  return orgId;
}

export async function listBranchesAction() {
  const orgId = await requireOrgId();
  return listBranches(orgId);
}

export async function createBranchAction(data: {
  name: string;
  isDefault?: boolean;
}) {
  const orgId = await requireOrgId();
  await createBranch(orgId, {
    name: data.name,
    isDefault: data.isDefault,
  });
  revalidatePath("/configuracoes/filiais");
}

export async function updateBranchAction(data: {
  id: string;
  name?: string;
  active?: boolean;
  isDefault?: boolean;
}) {
  const orgId = await requireOrgId();
  await updateBranch(data.id, orgId, {
    name: data.name,
    active: data.active,
    isDefault: data.isDefault,
  });
  revalidatePath("/configuracoes/filiais");
}
