import { FornecedoresView } from "@/components/compras/fornecedores-view";
import {
  canEditCompras,
  canViewCompras,
} from "@/lib/compras-access";
import { requireTenantContext } from "@/lib/tenant-context";
import {
  listSupplierCategoryLinks,
  listSuppliers,
} from "@boilerplate/db";
import { redirect } from "next/navigation";

export default async function FornecedoresPage() {
  const ctx = await requireTenantContext();
  if (!canViewCompras(ctx.role)) {
    redirect("/dashboard");
  }

  const rows = await listSuppliers(ctx.schemaName);
  const suppliers = await Promise.all(
    rows.map(async (row) => {
      const links = await listSupplierCategoryLinks(ctx.schemaName, row.id);
      const defaultLink = links.find((l) => l.is_default);
      return {
        id: row.id,
        name: row.name,
        document: row.document,
        email: row.email,
        phone: row.phone,
        leadTimeDays: row.lead_time_days,
        notes: row.notes,
        active: row.active,
        categoryIds: links.map((l) => l.category_id),
        defaultCategoryId: defaultLink?.category_id ?? null,
      };
    }),
  );

  return (
    <FornecedoresView
      initialSuppliers={suppliers}
      canEdit={canEditCompras(ctx.role)}
    />
  );
}
