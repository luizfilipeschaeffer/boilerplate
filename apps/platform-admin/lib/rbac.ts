import type { PlatformRole } from "@/lib/platform-role";

export type PlatformModuleId =
  | "dashboard"
  | "platform-crm"
  | "platform-comms"
  | "platform-insights"
  | "platform-modulos"
  | "platform-segmentos"
  | "platform-integradores"
  | "platform-comunidade"
  | "platform-roadmap"
  | "organizacoes";

const MODULE_ACCESS: Record<PlatformModuleId, PlatformRole[]> = {
  dashboard: [
    "platform_admin",
    "platform_comercial",
    "platform_suporte",
    "platform_produto",
    "platform_engenharia",
  ],
  "platform-crm": [
    "platform_admin",
    "platform_comercial",
    "platform_produto",
    "platform_suporte",
  ],
  "platform-comms": [
    "platform_admin",
    "platform_comercial",
    "platform_suporte",
  ],
  "platform-insights": [
    "platform_admin",
    "platform_produto",
    "platform_engenharia",
  ],
  "platform-modulos": [
    "platform_admin",
    "platform_produto",
    "platform_engenharia",
    "platform_comercial",
  ],
  "platform-segmentos": [
    "platform_admin",
    "platform_produto",
    "platform_engenharia",
    "platform_comercial",
    "platform_suporte",
  ],
  "platform-integradores": [
    "platform_admin",
    "platform_produto",
    "platform_engenharia",
  ],
  "platform-comunidade": [
    "platform_admin",
    "platform_produto",
    "platform_engenharia",
    "platform_comercial",
    "platform_suporte",
  ],
  "platform-roadmap": [
    "platform_admin",
    "platform_produto",
    "platform_engenharia",
    "platform_comercial",
  ],
  organizacoes: [
    "platform_admin",
    "platform_comercial",
    "platform_suporte",
    "platform_produto",
    "platform_engenharia",
  ],
};

export function canAccessPlatformModule(
  role: PlatformRole,
  moduleId: PlatformModuleId,
): boolean {
  return MODULE_ACCESS[moduleId]?.includes(role) ?? false;
}

export function getAccessibleModules(role: PlatformRole): PlatformModuleId[] {
  return (Object.keys(MODULE_ACCESS) as PlatformModuleId[]).filter((id) =>
    canAccessPlatformModule(role, id),
  );
}

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  platform_admin: "Administrador",
  platform_comercial: "Comercial",
  platform_suporte: "Suporte",
  platform_produto: "Produto",
  platform_engenharia: "Engenharia",
};
