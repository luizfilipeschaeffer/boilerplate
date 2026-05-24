import { auth } from "@/auth";
import {
  canAccessPlatformModule,
  type PlatformModuleId,
} from "@/lib/rbac";
import type { PlatformRole } from "@/lib/platform-role";

export class PlatformAccessError extends Error {
  constructor(message = "Acesso negado") {
    super(message);
    this.name = "PlatformAccessError";
  }
}

export async function requirePlatformSession() {
  const session = await auth();
  const role = session?.user?.platformRole;
  if (!session?.user?.id || !role) {
    throw new PlatformAccessError("Não autenticado");
  }
  return { userId: session.user.id, platformRole: role as PlatformRole };
}

export async function requirePlatformModule(moduleId: PlatformModuleId) {
  const ctx = await requirePlatformSession();
  if (!canAccessPlatformModule(ctx.platformRole, moduleId)) {
    throw new PlatformAccessError("Sem permissão para este módulo");
  }
  return ctx;
}
