import { auth } from "@/auth";
import { EstoqueMovimentacaoView } from "@/components/estoque-movimentacao-view";
import { listStockMovimentacaoPageAction } from "@/app/actions/stock";
import {
  canRegisterEstoqueMovimentacao,
  canViewEstoque,
} from "@/lib/estoque-access";
import { redirect } from "next/navigation";

export default async function EstoqueMovimentacaoPage() {
  const session = await auth();
  const role = session?.role ?? "dono";

  if (!canViewEstoque(role)) {
    redirect("/dashboard");
  }

  const { products, movementBatches, catalogItemCount } =
    await listStockMovimentacaoPageAction();

  return (
    <EstoqueMovimentacaoView
      initialProducts={products}
      initialMovementBatches={movementBatches}
      initialCatalogItemCount={catalogItemCount}
      canRegister={canRegisterEstoqueMovimentacao(role)}
    />
  );
}
