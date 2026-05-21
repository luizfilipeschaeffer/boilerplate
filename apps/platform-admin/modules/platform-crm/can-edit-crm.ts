import type { PlatformRole } from "@boilerplate/db";

export function canEditCrm(role: PlatformRole): boolean {
  return role === "platform_admin" || role === "platform_comercial";
}
