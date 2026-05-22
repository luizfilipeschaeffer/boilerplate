import { PurchaseOrderDetail } from "@/components/compras/purchase-order-detail";
import {
  canCancelCompras,
  canEditCompras,
  canViewCompras,
} from "@/lib/compras-access";
import { requireTenantContext } from "@/lib/tenant-context";
import { getPurchaseOrderById } from "@boilerplate/db";
import { notFound, redirect } from "next/navigation";

export default async function CompraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireTenantContext();
  if (!canViewCompras(ctx.role)) {
    redirect("/dashboard");
  }

  const po = await getPurchaseOrderById(ctx.schemaName, id);
  if (!po) notFound();

  return (
    <PurchaseOrderDetail
      initial={{
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
      }}
      canEdit={canEditCompras(ctx.role)}
      canCancel={canCancelCompras(ctx.role)}
    />
  );
}
