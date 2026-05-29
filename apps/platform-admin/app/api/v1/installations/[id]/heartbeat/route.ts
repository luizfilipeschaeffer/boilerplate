import { NextRequest } from "next/server";
import { recordInstallationHeartbeat } from "@boilerplate/db/self-hosted";
import {
  requireInstallationAuth,
  jsonResponse,
  errorResponse,
} from "@/lib/control-plane/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireInstallationAuth(req);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  if (id !== auth.installationId) {
    return errorResponse("INSTALLATION_MISMATCH", 403);
  }
  const body = await req.json();
  await recordInstallationHeartbeat(id, body);
  return jsonResponse({ ok: true });
}
