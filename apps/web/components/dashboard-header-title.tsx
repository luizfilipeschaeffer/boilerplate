"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "Início",
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
