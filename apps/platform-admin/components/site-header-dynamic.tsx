"use client";

import { usePathname } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { usePlatformHeaderTitle } from "@/components/platform-header-title";

export function SiteHeaderDynamic() {
  const pathname = usePathname();
  const compact =
    pathname === "/comms" || pathname.startsWith("/comms/");
  const title = usePlatformHeaderTitle();
  return <SiteHeader title={title} compact={compact} />;
}
