import { NextRequest } from "next/server";
import { setCentralAllowedOrigins, getCentralAllowedOrigins } from "@boilerplate/db/self-hosted";
import { requireInstallationAuth, jsonResponse, errorResponse } from "@/lib/control-plane/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireInstallationAuth(req);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  if (id !== auth.installationId) return errorResponse("INSTALLATION_MISMATCH", 403);
  const origins = await getCentralAllowedOrigins(id);
  return jsonResponse({ origins });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireInstallationAuth(req);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  if (id !== auth.installationId) return errorResponse("INSTALLATION_MISMATCH", 403);
  const body = await req.json();
  const origins = Array.isArray(body.origins) ? body.origins.map(String) : [];
  await setCentralAllowedOrigins(id, origins);
  return jsonResponse({ ok: true, origins });
}
