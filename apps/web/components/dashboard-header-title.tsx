"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "Início",
  "/estoque": "Estoque",
  "/fluxo-caixa": "Fluxo de caixa",
  "/vendedores": "Vendedores",
  "/pedidos": "Pedidos",
  "/configuracoes": "Configurações",
  "/configuracoes/filiais": "Filiais",
  "/configuracoes/membros": "Membros",
  "/configuracoes/setores": "Setores",
  "/configuracoes/pagamentos": "Formas de pagamento",
};

export function useDashboardHeaderTitle(fallback = "Início") {
  const pathname = usePathname();
  if (titles[pathname]) return titles[pathname];
  const segment = pathname.split("/").filter(Boolean).pop();
  if (!segment || segment === "dashboard") return fallback;
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
