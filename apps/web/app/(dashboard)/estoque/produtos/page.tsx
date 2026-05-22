import { auth } from "@/auth";
import { EstoqueProdutosView } from "@/components/estoque-produtos-view";
import { MissionVisitTracker } from "@/components/mission-visit-tracker";
import { listStockProductsPageAction } from "@/app/actions/stock";
import {
  canEditEstoqueProdutos,
  canViewEstoque,
} from "@/lib/estoque-access";
import { redirect } from "next/navigation";

export default async function EstoqueProdutosPage() {
  const session = await auth();
  const role = session?.role ?? "dono";

  if (!canViewEstoque(role)) {
    redirect("/dashboard");
  }

  const { products, catalogItemCount, lowCount } =
    await listStockProductsPageAction();

  return (
    <>
      <MissionVisitTracker missionId="ver_estoque" />
      <EstoqueProdutosView
        initialProducts={products}
        initialCatalogItemCount={catalogItemCount}
        initialLowCount={lowCount}
        canEdit={canEditEstoqueProdutos(role)}
      />
    </>
  );
}
