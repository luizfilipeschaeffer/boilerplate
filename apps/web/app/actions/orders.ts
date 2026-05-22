"use server";

import { emitAndPersist } from "@/lib/events/emit";
import { requireTenantContext } from "@/lib/tenant-context";
import {
  cancelOrder,
  convertOrderToSale,
  listOrders,
  upsertOrder,
  type PaymentMethod,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

export async function listOrdersAction() {
  const { schemaName, branchId } = await requireTenantContext();
  return listOrders(schemaName, {
    status: ["rascunho", "pedido"],
    branchId: branchId ?? undefined,
  });
}

export async function upsertOrderAction(data: {
  orderId?: string;
  clientId?: string | null;
  sellerId?: string | null;
  status?: "rascunho" | "pedido";
  notes?: string | null;
  allowedPaymentMethodCodes?: string[] | null;
  lines: { catalogItemId: string; quantity: number }[];
}) {
  const ctx = await requireTenantContext();
  const order = await upsertOrder(ctx.schemaName, {
    ...data,
    branchId: ctx.branchId,
  });
  revalidatePath("/pedidos");
  return order;
}

export async function convertOrderAction(
  orderId: string,
  paymentMethod: PaymentMethod,
) {
  const ctx = await requireTenantContext();
  const order = await convertOrderToSale(
    ctx.schemaName,
    orderId,
    paymentMethod,
  );
  await emitAndPersist({
    type: "pedido.convertido",
    organizationId: ctx.organizationId,
    schemaName: ctx.schemaName,
    payload: { orderId, saleId: order.id, totalCents: order.total_cents },
  });
  revalidatePath("/pedidos");
  revalidatePath("/vendas");
  return order;
}

export async function cancelOrderAction(orderId: string) {
  const { schemaName } = await requireTenantContext();
  await cancelOrder(schemaName, orderId);
  revalidatePath("/pedidos");
}
