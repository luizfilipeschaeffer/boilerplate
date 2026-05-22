"use server";

import { randomUUID } from "node:crypto";

import { emitAndPersist } from "@/lib/events/emit";
import {
  assertEstoquePermission,
  ESTOQUE_ROUTES,
} from "@/lib/estoque-access";
import { requireTenantContext } from "@/lib/tenant-context";
import {
  adjustStock,
  listCatalogItems,
  listLowStockItems,
  listStockMovementBatches,
  setStockMinimum,
  type StockMovementType,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

const MOVIMENTACAO_TIPOS: StockMovementType[] = ["entrada", "ajuste"];

export type StockProductRow = {
  id: string;
  name: string;
  stockQty: number;
  stockMin: number;
  isLow: boolean;
};

export type StockMovementLineRow = {
  id: string;
  productName: string;
  quantity: number;
};

export type StockMovementBatchRow = {
  batchId: string;
  movementType: StockMovementType;
  note: string | null;
  createdAt: string;
  lines: StockMovementLineRow[];
};

function revalidateEstoquePaths() {
  revalidatePath(ESTOQUE_ROUTES.root);
  revalidatePath(ESTOQUE_ROUTES.produtos);
  revalidatePath(ESTOQUE_ROUTES.movimentacao);
  revalidatePath("/catalogo");
}

async function loadProductRows(schemaName: string) {
  const [items, low] = await Promise.all([
    listCatalogItems(schemaName),
    listLowStockItems(schemaName),
  ]);
  const productItems = items.filter((i) => i.item_type === "produto");
  return {
    products: productItems.map((i) => ({
      id: i.id,
      name: i.name,
      stockQty: i.stock_qty,
      stockMin: i.stock_min,
      isLow: low.some((l) => l.id === i.id),
    })) satisfies StockProductRow[],
    lowCount: low.length,
    catalogItemCount: items.length,
    productCount: productItems.length,
  };
}

export async function listStockProductsPageAction() {
  const ctx = await requireTenantContext();
  assertEstoquePermission(ctx.role, "ver");
  return loadProductRows(ctx.schemaName);
}

export async function listStockMovimentacaoPageAction() {
  const ctx = await requireTenantContext();
  assertEstoquePermission(ctx.role, "ver");
  const [productData, batches] = await Promise.all([
    loadProductRows(ctx.schemaName),
    listStockMovementBatches(ctx.schemaName),
  ]);
  return {
    ...productData,
    movementBatches: batches.map((b) => ({
      batchId: b.batchId,
      movementType: b.movementType,
      note: b.note,
      createdAt: b.createdAt.toISOString(),
      lines: b.lines.map((l) => ({
        id: l.id,
        productName: l.productName,
        quantity: l.quantity,
      })),
    })) satisfies StockMovementBatchRow[],
  };
}

/** @deprecated Use listStockProductsPageAction ou listStockMovimentacaoPageAction */
export async function listStockAction() {
  const ctx = await requireTenantContext();
  assertEstoquePermission(ctx.role, "ver");
  const [productData, batches] = await Promise.all([
    loadProductRows(ctx.schemaName),
    listStockMovementBatches(ctx.schemaName),
  ]);
  return {
    ...productData,
    movementBatches: batches.map((b) => ({
      batchId: b.batchId,
      movementType: b.movementType,
      note: b.note,
      createdAt: b.createdAt.toISOString(),
      lines: b.lines.map((l) => ({
        id: l.id,
        productName: l.productName,
        quantity: l.quantity,
      })),
    })) satisfies StockMovementBatchRow[],
  };
}

export async function setStockMinAction(catalogItemId: string, stockMin: number) {
  const ctx = await requireTenantContext();
  assertEstoquePermission(ctx.role, "editar");
  await setStockMinimum(ctx.schemaName, catalogItemId, stockMin);
  revalidateEstoquePaths();
}

export async function saveStockMinsAction(
  items: { catalogItemId: string; stockMin: number }[],
) {
  if (items.length === 0) return { count: 0 };
  const ctx = await requireTenantContext();
  assertEstoquePermission(ctx.role, "editar");
  for (const item of items) {
    await setStockMinimum(
      ctx.schemaName,
      item.catalogItemId,
      Math.max(0, Math.floor(item.stockMin)),
    );
  }
  revalidateEstoquePaths();
  return { count: items.length };
}

export type StockMovementLineInput = {
  catalogItemId: string;
  quantity: number;
};

export async function registerStockMovementsAction(data: {
  movementType: StockMovementType;
  note?: string | null;
  lines: StockMovementLineInput[];
}) {
  if (!MOVIMENTACAO_TIPOS.includes(data.movementType)) {
    throw new Error("Tipo de movimento não permitido nesta tela.");
  }

  const uniqueIds = new Set(data.lines.map((l) => l.catalogItemId));
  if (data.lines.length === 0) {
    throw new Error("Adicione ao menos um produto.");
  }
  if (uniqueIds.size !== data.lines.length) {
    throw new Error("Cada produto deve aparecer apenas uma vez na lista.");
  }

  const ctx = await requireTenantContext();
  assertEstoquePermission(ctx.role, "registrar");

  const catalog = await listCatalogItems(ctx.schemaName);
  const byId = new Map(catalog.map((i) => [i.id, i]));
  const batchId = randomUUID();

  for (const line of data.lines) {
    const item = byId.get(line.catalogItemId);
    if (!item || item.item_type !== "produto") {
      throw new Error("Produto inválido ou não encontrado.");
    }
    const result = await adjustStock(ctx.schemaName, {
      catalogItemId: line.catalogItemId,
      movementType: data.movementType,
      quantity: line.quantity,
      note: data.note ?? null,
      batchId,
    });
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
  }

  revalidateEstoquePaths();
  return { count: data.lines.length };
}
