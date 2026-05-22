"use server";

import { emitAndPersist } from "@/lib/events/emit";
import { requireTenantContext } from "@/lib/tenant-context";
import {
  createSale,
  listClients,
  listCatalogItems,
  listSales,
  listSellers,
  type PaymentMethod,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

export async function listSalesAction() {
  const { schemaName } = await requireTenantContext();
  return listSales(schemaName);
}

export async function getSaleFormDataAction() {
  const { schemaName } = await requireTenantContext();
  const [clients, items, sellers] = await Promise.all([
    listClients(schemaName),
    listCatalogItems(schemaName),
    listSellers(schemaName).catch(() => []),
  ]);
  return {
    clients: clients.map((c) => ({ id: c.id, name: c.name })),
    sellers: sellers
      .filter((s) => s.active)
      .map((s) => ({ id: s.id, name: s.name })),
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      priceCents: i.price_cents,
      itemType: i.item_type,
      stockQty: i.stock_qty,
    })),
  };
}

export async function createSaleAction(data: {
  clientId?: string | null;
  sellerId?: string | null;
  paymentMethod: PaymentMethod;
  lines: { catalogItemId: string; quantity: number }[];
  idempotencyKey?: string | null;
}) {
  const ctx = await requireTenantContext();
  const sale = await createSale(ctx.schemaName, {
    ...data,
    branchId: ctx.branchId,
  });
  await emitAndPersist({
    type: "venda.confirmada",
    organizationId: ctx.organizationId,
    schemaName: ctx.schemaName,
    payload: {
      saleId: sale.id,
      totalCents: sale.total_cents,
      itemCount: sale.items.length,
    },
  });
  revalidatePath("/vendas");
  revalidatePath("/estoque");
  revalidatePath("/ranking");
  revalidatePath("/fluxo-caixa");
  revalidatePath("/vendedores");
  revalidatePath("/relatorios");
  return sale;
}
