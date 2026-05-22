"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "Início",
  "/crm": "CRM",
  "/comms": "Comunicação",
  "/insights": "Insights",
  "/modulos/catalogo": "Catálogo de módulos",
  "/modulos/planos": "Planos base",
  "/modulos/bundles": "Bundles fiscais",
  "/modulos/ativacoes": "Ativações",
  "/modulos": "Gerenciador de módulos",
  "/segmentos/ativacoes": "Ativações e trials",
  "/segmentos": "Segmentos de negócio",
  "/integradores/gateways": "Gateways de pagamento",
  "/integradores": "Integradores",
  "/organizacoes": "Organizações",
};

export function usePlatformHeaderTitle(fallback = "Painel") {
  const pathname = usePathname();
  const match = Object.entries(titles)
    .sort((a, b) => b[0].length - a[0].length)
    .find(
      ([path]) => pathname === path || pathname.startsWith(`${path}/`),
    );
  return match?.[1] ?? fallback;
}
