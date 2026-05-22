"use server";

import { emitAndPersist } from "@/lib/events/emit";
import { assertComprasPermission } from "@/lib/compras-access";
import { requireTenantContext } from "@/lib/tenant-context";
import {
  generatePurchaseOrdersFromLowStock,
  getPurchaseOrderById,
  listPurchaseOrders,
  updatePurchaseOrderStatus,
  type PurchaseOrderStatus,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

export type PurchaseOrderLineDto = {
  id: string;
  catalogItemId: string;
  quantity: number;
  unitCostCents: number | null;
  notes: string | null;
};

export type PurchaseOrderDto = {
  id: string;
  supplierId: string;
  supplierName?: string;
  status: string;
  notes: string | null;
  createdAt: string;
  lines: PurchaseOrderLineDto[];
};

function mapPo(po: Awaited<ReturnType<typeof getPurchaseOrderById>>): PurchaseOrderDto | null {
  if (!po) return null;
  return {
    id: po.id,
    supplierId: po.supplier_id,
    supplierName: po.supplier_name,
    status: po.status,
    notes: po.notes,
    createdAt: po.created_at.toISOString(),
    lines: po.lines.map((l) => ({
      id: l.id,
      catalogItemId: l.catalog_item_id,
      quantity: l.quantity,
      unitCostCents: l.unit_cost_cents,
      notes: l.notes,
    })),
  };
}

export async function listPurchaseOrdersAction(): Promise<PurchaseOrderDto[]> {
  const ctx = await requireTenantContext();
  assertComprasPermission(ctx.role, "ver");
  const rows = await listPurchaseOrders(ctx.schemaName);
  return rows.map((po) => ({
    id: po.id,
    supplierId: po.supplier_id,
    supplierName: po.supplier_name,
    status: po.status,
    notes: po.notes,
    createdAt: po.created_at.toISOString(),
    lines: po.lines.map((l) => ({
      id: l.id,
      catalogItemId: l.catalog_item_id,
      quantity: l.quantity,
      unitCostCents: l.unit_cost_cents,
      notes: l.notes,
    })),
  }));
}

export async function getPurchaseOrderAction(
  id: string,
): Promise<PurchaseOrderDto | null> {
  const ctx = await requireTenantContext();
  assertComprasPermission(ctx.role, "ver");
  const po = await getPurchaseOrderById(ctx.schemaName, id);
  return mapPo(po);
}

export async function generatePurchaseOrdersFromLowStockAction() {
  const ctx = await requireTenantContext();
  assertComprasPermission(ctx.role, "registrar");
  const result = await generatePurchaseOrdersFromLowStock(ctx.schemaName);

  for (const po of result.created) {
    await emitAndPersist({
      type: "ordem_compra.criada",
      organizationId: ctx.organizationId,
      schemaName: ctx.schemaName,
      payload: {
        purchaseOrderId: po.id,
        supplierId: po.supplier_id,
        lineCount: po.lines.length,
        auto: true,
      },
    });
  }

  if (result.created.length > 0 || result.pending.length > 0) {
    await emitAndPersist({
      type: "estoque.reposicao_sugerida",
      organizationId: ctx.organizationId,
      schemaName: ctx.schemaName,
      payload: {
        ordersCreated: result.created.length,
        pendingCount: result.pending.length,
      },
    });
  }

  revalidatePath("/compras");
  revalidatePath("/estoque/produtos");

  return {
    created: result.created.map((po) => ({
      id: po.id,
      supplierName: po.supplier_name,
      lineCount: po.lines.length,
    })),
    pending: result.pending,
  };
}

export async function sendPurchaseOrderAction(id: string) {
  const ctx = await requireTenantContext();
  assertComprasPermission(ctx.role, "editar");
  const po = await updatePurchaseOrderStatus(
    ctx.schemaName,
    id,
    "enviada" as PurchaseOrderStatus,
  );
  await emitAndPersist({
    type: "ordem_compra.enviada",
    organizationId: ctx.organizationId,
    schemaName: ctx.schemaName,
    payload: { purchaseOrderId: po.id, supplierId: po.supplier_id },
  });
  revalidatePath("/compras");
  revalidatePath(`/compras/${id}`);
}

export async function cancelPurchaseOrderAction(id: string) {
  const ctx = await requireTenantContext();
  assertComprasPermission(ctx.role, "cancelar");
  await updatePurchaseOrderStatus(ctx.schemaName, id, "cancelada");
  revalidatePath("/compras");
  revalidatePath(`/compras/${id}`);
}
