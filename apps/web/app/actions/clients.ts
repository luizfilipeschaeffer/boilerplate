"use server";

import { emitAndPersist } from "@/lib/events/emit";
import { requireTenantContext } from "@/lib/tenant-context";
import {
  createClient,
  listClients,
  setClientActive,
  updateClient,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

export async function listClientsAction() {
  const { schemaName } = await requireTenantContext();
  const rows = await listClients(schemaName);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    active: r.active,
  }));
}

export async function createClientAction(data: {
  name: string;
  email?: string | null;
  phone?: string | null;
}) {
  const ctx = await requireTenantContext();
  const row = await createClient(ctx.schemaName, data);
  await emitAndPersist({
    type: "cliente.criado",
    organizationId: ctx.organizationId,
    schemaName: ctx.schemaName,
    payload: { clientId: row.id, name: row.name },
  });
  revalidatePath("/clientes");
}

export async function updateClientAction(
  id: string,
  data: {
    name: string;
    email?: string | null;
    phone?: string | null;
  },
) {
  const ctx = await requireTenantContext();
  await updateClient(ctx.schemaName, id, data);
  revalidatePath("/clientes");
}

export async function setClientActiveAction(id: string, active: boolean) {
  const ctx = await requireTenantContext();
  await setClientActive(ctx.schemaName, id, active);
  revalidatePath("/clientes");
}
