import Link from "next/link";
import { Button } from "@/components/ui/button";

export type StockEmptyReason = "no_catalog" | "no_products" | "sync_pending";

const COPY: Record<
  StockEmptyReason,
  { title: string; description: string; cta?: string }
> = {
  no_catalog: {
    title: "Catálogo vazio",
    description:
      "Não há itens cadastrados. Para gerenciar estoque, cadastre pelo menos um item do tipo produto no catálogo.",
    cta: "Ir para o catálogo",
  },
  no_products: {
    title: "Nenhum produto no catálogo",
    description:
      "Não há itens do tipo produto para gerenciar o estoque. Serviços não possuem saldo — cadastre um produto no catálogo para registrar entradas, saídas e alertas de estoque baixo.",
    cta: "Cadastrar produto",
  },
  sync_pending: {
    title: "Sincronizando estoque",
    description:
      "Há produtos no catálogo, mas os dados ainda não chegaram neste dispositivo. Aguarde ou tente sincronizar novamente.",
  },
};

export function StockEmptyState({
  reason,
  onRetrySync,
}: {
  reason: StockEmptyReason;
  onRetrySync?: () => void;
}) {
  const copy = COPY[reason];
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-5 text-sm">
      <p className="font-medium text-foreground">{copy.title}</p>
      <p className="text-muted-foreground">{copy.description}</p>
      {copy.cta ? (
        <Button variant="outline" size="sm" className="w-fit" render={<Link href="/catalogo" />}>
          {copy.cta}
        </Button>
      ) : null}
      {reason === "sync_pending" && onRetrySync ? (
        <Button variant="outline" size="sm" className="w-fit" type="button" onClick={onRetrySync}>
          Sincronizar agora
        </Button>
      ) : null}
    </div>
  );
}
