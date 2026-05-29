import { NextRequest } from "next/server";
import { buildLicensePayload } from "@boilerplate/license-server";
import { requireInstallationAuth, jsonResponse } from "@/lib/control-plane/auth";

type Params = { params: Promise<{ installationId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireInstallationAuth(req);
  if (auth instanceof Response) return auth;
  const { installationId } = await params;
  if (installationId !== auth.installationId) {
    return jsonResponse({ error: "INSTALLATION_MISMATCH" }, 403);
  }
  const payload = await buildLicensePayload(auth.organizationId, installationId);
  return jsonResponse(payload);
}
