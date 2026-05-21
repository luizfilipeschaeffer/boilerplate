"use server";

import { requireTenantContext } from "@/lib/tenant-context";
import { getTopClients, getTopItems } from "@boilerplate/db";

export async function getRankingAction() {
  const { schemaName } = await requireTenantContext();
  const [items, clients] = await Promise.all([
    getTopItems(schemaName),
    getTopClients(schemaName),
  ]);
  return { items, clients };
}
