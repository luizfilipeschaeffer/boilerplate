import { NextRequest } from "next/server";
import {
  registerInstallationFromToken,
  recordInstallationHeartbeat,
} from "@boilerplate/db/self-hosted";
import { buildLicensePayload } from "@boilerplate/license-server";
import {
  requireInstallationAuth,
  jsonResponse,
  errorResponse,
} from "@/lib/control-plane/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await registerInstallationFromToken({
      installationToken: body.installationToken,
      publicUrl: body.publicUrl,
      platformVersion: body.platformVersion ?? "0.0.0",
    });
    return jsonResponse(result, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "REGISTER_FAILED";
    return errorResponse(msg, 400);
  }
}
