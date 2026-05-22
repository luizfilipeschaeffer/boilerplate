import type { PlatformRole } from "@boilerplate/db";

export function canEditSegments(role: PlatformRole): boolean {
  return role === "platform_admin" || role === "platform_produto";
}

export function canViewActivations(role: PlatformRole): boolean {
  return (
    role === "platform_admin" ||
    role === "platform_produto" ||
    role === "platform_comercial" ||
    role === "platform_suporte"
  );
}

export function canEditGateways(role: PlatformRole): boolean {
  return role === "platform_admin";
}
