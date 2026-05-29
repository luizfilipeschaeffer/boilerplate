import { NextResponse } from "next/server";
import { resolveDeploymentMode } from "@boilerplate/platform-api";
import { isSetupComplete } from "@boilerplate/db/self-hosted";

export async function GET() {
  if (resolveDeploymentMode() !== "self_hosted") {
    return NextResponse.json({ complete: true, selfHosted: false });
  }
  const complete = await isSetupComplete();
  return NextResponse.json({ complete, selfHosted: true });
}
