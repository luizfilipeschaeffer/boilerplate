"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "Início",
  "/crm": "CRM",
  "/comms": "Comunicação",
  "/insights": "Insights",
  "/organizacoes": "Organizações",
};

export function usePlatformHeaderTitle(fallback = "Painel") {
  const pathname = usePathname();
  return titles[pathname] ?? fallback;
}
