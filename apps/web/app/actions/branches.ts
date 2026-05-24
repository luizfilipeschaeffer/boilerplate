"use server";

import {
  createBranch,
  listBranches,
  updateBranch,
} from "@boilerplate/db";
import { requireTenantContext } from "@/lib/tenant-context";
import { revalidatePath } from "next/cache";

export async function listBranchesAction() {
  const { organizationId } = await requireTenantContext();
  return listBranches(organizationId);
}

export async function createBranchAction(data: {
  name: string;
  isDefault?: boolean;
}) {
  const { organizationId } = await requireTenantContext();
  await createBranch(organizationId, {
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
  const { organizationId } = await requireTenantContext();
  await updateBranch(data.id, organizationId, {
    name: data.name,
    active: data.active,
    isDefault: data.isDefault,
  });
  revalidatePath("/configuracoes/filiais");
}
