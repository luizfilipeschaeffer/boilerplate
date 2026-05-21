"use server";

import { emitAndPersist } from "@/lib/events/emit";
import { requireTenantContext } from "@/lib/tenant-context";
import {
  adjustStock,
  listCatalogItems,
  listLowStockItems,
  setStockMinimum,
  type StockMovementType,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

export async function listStockAction() {
  const { schemaName } = await requireTenantContext();
  const items = await listCatalogItems(schemaName);
  const low = await listLowStockItems(schemaName);
  return {
    products: items
      .filter((i) => i.item_type === "produto")
      .map((i) => ({
        id: i.id,
        name: i.name,
        stockQty: i.stock_qty,
        stockMin: i.stock_min,
        isLow: low.some((l) => l.id === i.id),
      })),
    lowCount: low.length,
  };
}

export async function adjustStockAction(data: {
  catalogItemId: string;
  movementType: StockMovementType;
  quantity: number;
  note?: string | null;
}) {
  const ctx = await requireTenantContext();
  const result = await adjustStock(ctx.schemaName, data);
  const low = await listLowStockItems(ctx.schemaName);
  const isLow = low.some((l) => l.id === result.item.id);
  if (isLow) {
    await emitAndPersist({
      type: "estoque.baixo",
      organizationId: ctx.organizationId,
      schemaName: ctx.schemaName,
      payload: {
        catalogItemId: result.item.id,
        name: result.item.name,
        stockQty: result.item.stock_qty,
        stockMin: result.item.stock_min,
      },
    });
  }
  revalidatePath("/estoque");
  revalidatePath("/catalogo");
}

export async function setStockMinAction(catalogItemId: string, stockMin: number) {
  const { schemaName } = await requireTenantContext();
  await setStockMinimum(schemaName, catalogItemId, stockMin);
  revalidatePath("/estoque");
}
