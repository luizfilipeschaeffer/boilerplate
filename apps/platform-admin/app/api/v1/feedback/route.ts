import { NextRequest } from "next/server";
import { bridgeCustomerFeedback } from "@boilerplate/feedback-bridge";
import { requireInstallationAuth, jsonResponse, errorResponse } from "@/lib/control-plane/auth";

export async function POST(req: NextRequest) {
  const auth = await requireInstallationAuth(req);
  if (auth instanceof Response) return auth;
  const body = await req.json();
  if (body.installationId !== auth.installationId) {
    return errorResponse("INSTALLATION_MISMATCH", 403);
  }
  const result = await bridgeCustomerFeedback(body);
  return jsonResponse(result, 201);
}
