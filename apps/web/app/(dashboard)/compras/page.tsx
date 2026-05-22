import { ComprasView } from "@/components/compras/compras-view";
import { canRegisterCompras, canViewCompras } from "@/lib/compras-access";
import { requireTenantContext } from "@/lib/tenant-context";
import { listPurchaseOrders } from "@boilerplate/db";
import { redirect } from "next/navigation";

export default async function ComprasPage() {
  const ctx = await requireTenantContext();
  if (!canViewCompras(ctx.role)) {
    redirect("/dashboard");
  }

  const orders = await listPurchaseOrders(ctx.schemaName);

  return (
    <ComprasView
      initialOrders={orders.map((o) => ({
        id: o.id,
        supplierId: o.supplier_id,
        supplierName: o.supplier_name,
        status: o.status,
        notes: o.notes,
        createdAt: o.created_at.toISOString(),
        lines: o.lines.map((l) => ({
          id: l.id,
          catalogItemId: l.catalog_item_id,
          quantity: l.quantity,
          unitCostCents: l.unit_cost_cents,
          notes: l.notes,
        })),
      }))}
      canRegister={canRegisterCompras(ctx.role)}
    />
  );
}
