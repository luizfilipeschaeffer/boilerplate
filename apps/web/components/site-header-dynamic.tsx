"use client";

import { useDashboardHeaderTitle } from "@/components/dashboard-header-title";
import { SiteHeader } from "@/components/site-header";

export function SiteHeaderDynamic({ fallback = "Início" }: { fallback?: string }) {
  const title = useDashboardHeaderTitle(fallback);
  return <SiteHeader title={title} />;
}
