import { NextRequest } from "next/server";
import { findInstallationByKey } from "@boilerplate/db/self-hosted";

export async function requireInstallationAuth(
  req: NextRequest,
): Promise<{ installationId: string; organizationId: string } | Response> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), { status: 401 });
  }
  const key = auth.slice(7);
  const inst = await findInstallationByKey(key);
  if (!inst || inst.status === "revoked") {
    return new Response(JSON.stringify({ error: "INVALID_INSTALLATION_KEY" }), {
      status: 401,
    });
  }
  return { installationId: inst.id, organizationId: inst.organizationId };
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}
