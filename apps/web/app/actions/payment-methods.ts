"use server";

import { requireTenantContext } from "@/lib/tenant-context";
import {
  createPaymentMethod,
  listPaymentMethods,
  updatePaymentMethod,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

export async function listPaymentMethodsAction(activeOnly = false) {
  const { schemaName } = await requireTenantContext();
  return listPaymentMethods(schemaName, activeOnly);
}

export async function createPaymentMethodAction(data: {
  code: string;
  label: string;
}) {
  const { schemaName } = await requireTenantContext();
  await createPaymentMethod(schemaName, data);
  revalidatePath("/configuracoes/pagamentos");
}

export async function updatePaymentMethodAction(data: {
  id: string;
  label?: string;
  active?: boolean;
}) {
  const { schemaName } = await requireTenantContext();
  await updatePaymentMethod(schemaName, data.id, {
    label: data.label,
    active: data.active,
  });
  revalidatePath("/configuracoes/pagamentos");
}
