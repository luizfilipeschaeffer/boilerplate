"use client";

import { SiteHeader } from "@/components/site-header";
import { usePlatformHeaderTitle } from "@/components/platform-header-title";

export function SiteHeaderDynamic() {
  return <SiteHeader title={usePlatformHeaderTitle()} />;
}
