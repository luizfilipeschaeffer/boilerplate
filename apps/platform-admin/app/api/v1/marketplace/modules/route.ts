import { NextRequest } from "next/server";
import { listMarketplaceListings } from "@boilerplate/db/self-hosted";
import { buildLicensePayload } from "@boilerplate/license-server";
import { requireInstallationAuth, jsonResponse } from "@/lib/control-plane/auth";

export async function GET(req: NextRequest) {
  const auth = await requireInstallationAuth(req);
  if (auth instanceof Response) return auth;
  const license = await buildLicensePayload(auth.organizationId, auth.installationId);
  const all = await listMarketplaceListings();
  const modules = all.filter((m) =>
    m.entitlementsRequired.every((e) => license.entitlements.includes(e)),
  );
  return jsonResponse({ modules });
}
