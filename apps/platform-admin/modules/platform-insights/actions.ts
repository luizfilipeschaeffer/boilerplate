"use server";

import { buildInsightsExportCsv, type PlatformRole } from "@boilerplate/db";
import { auth } from "@/auth";
import { canAccessPlatformModule } from "@/lib/rbac";

async function requireInsightsAccess() {
  const session = await auth();
  const role = session?.user?.platformRole as PlatformRole | undefined;
  if (!role || !canAccessPlatformModule(role, "platform-insights")) {
    throw new Error("Sem permissão para insights");
  }
}

export async function exportInsightsCsvAction(): Promise<string> {
  await requireInsightsAccess();
  return buildInsightsExportCsv();
}
