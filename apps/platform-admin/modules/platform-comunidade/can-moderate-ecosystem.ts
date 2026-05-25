import type { PlatformRole } from "@boilerplate/db";

export function canModerateEcosystem(role: PlatformRole): boolean {
  return (
    role === "platform_admin" ||
    role === "platform_produto" ||
    role === "platform_engenharia"
  );
}
