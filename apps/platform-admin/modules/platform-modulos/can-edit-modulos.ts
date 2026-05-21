import type { PlatformRole } from "@boilerplate/db";

export function canEditModulosPricing(role: PlatformRole): boolean {
  return role === "platform_admin" || role === "platform_produto";
}
