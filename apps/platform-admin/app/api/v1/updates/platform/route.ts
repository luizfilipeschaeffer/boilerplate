import { NextRequest } from "next/server";
import { listReleasesForTarget } from "@boilerplate/update-server";
import { requireInstallationAuth, jsonResponse } from "@/lib/control-plane/auth";

export async function GET(req: NextRequest) {
  const auth = await requireInstallationAuth(req);
  if (auth instanceof Response) return auth;
  const releases = await listReleasesForTarget({
    targetType: "platform",
    targetId: "boilerplate",
  });
  return jsonResponse({
    releases: releases.map((r) => ({
      id: r.id,
      version: r.version,
      changelog: r.changelog,
    })),
  });
}
