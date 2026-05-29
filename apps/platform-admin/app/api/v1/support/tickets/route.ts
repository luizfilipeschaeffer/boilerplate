import { NextRequest } from "next/server";
import {
  createSupportTicket,
  listSupportTicketsForInstallation,
} from "@boilerplate/db/self-hosted";
import { requireInstallationAuth, jsonResponse, errorResponse } from "@/lib/control-plane/auth";

export async function GET(req: NextRequest) {
  const auth = await requireInstallationAuth(req);
  if (auth instanceof Response) return auth;
  const installationId =
    req.nextUrl.searchParams.get("installationId") ?? auth.installationId;
  if (installationId !== auth.installationId) {
    return errorResponse("INSTALLATION_MISMATCH", 403);
  }
  const tickets = await listSupportTicketsForInstallation(installationId);
  return jsonResponse({ tickets });
}

export async function POST(req: NextRequest) {
  const auth = await requireInstallationAuth(req);
  if (auth instanceof Response) return auth;
  const body = await req.json();
  if (body.installationId !== auth.installationId) {
    return errorResponse("INSTALLATION_MISMATCH", 403);
  }
  const ticket = await createSupportTicket(body, body.createdByUserId);
  return jsonResponse(ticket, 201);
}
