import { auth } from "@/auth";
import { EstoqueProdutosView } from "@/components/estoque-produtos-view";
import { MissionVisitTracker } from "@/components/mission-visit-tracker";
import { listStockProductsPageAction } from "@/app/actions/stock";
import {
  canEditEstoqueProdutos,
  canViewEstoque,
} from "@/lib/estoque-access";
import { canRegisterCompras } from "@/lib/compras-access";
import { getActiveModuleIds } from "@/lib/modules/active-modules";
import { redirect } from "next/navigation";

export default async function EstoqueProdutosPage() {
  const session = await auth();
  const role = session?.role ?? "dono";

  if (!canViewEstoque(role)) {
    redirect("/dashboard");
  }

  const { products, catalogItemCount, lowCount } =
    await listStockProductsPageAction();

  const orgId = session?.organizationId;
  const moduleIds = orgId ? await getActiveModuleIds(orgId) : [];
  const canGenerateCompras =
    moduleIds.includes("ops-compras") && canRegisterCompras(role);

  return (
    <>
      <MissionVisitTracker missionId="ver_estoque" />
      <EstoqueProdutosView
        initialProducts={products}
        initialCatalogItemCount={catalogItemCount}
        initialLowCount={lowCount}
        canEdit={canEditEstoqueProdutos(role)}
        canGenerateCompras={canGenerateCompras}
      />
    </>
  );
}
