import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveDeploymentMode, resolveAuthMode } from "@boilerplate/platform-api";
import { getSetupStatus } from "@boilerplate/db/self-hosted";
import { SetupWizardClient } from "@/components/setup-wizard-client";
import { getCentralApiUrl } from "@/lib/platform-client";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ step?: string }>;
};

export default async function SetupPage({ searchParams }: Props) {
  if (resolveDeploymentMode() !== "self_hosted") {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const status = await getSetupStatus();
  if (status.complete) {
    redirect("/dashboard");
  }

  if (sp.step === "license") {
    status.step = "license";
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const detectedPublicUrl = `${proto}://${host}`;

  return (
    <SetupWizardClient
      initialStatus={status}
      defaultCentralUrl={getCentralApiUrl()}
      detectedPublicUrl={detectedPublicUrl}
      useCentralAuth={resolveAuthMode() === "central"}
    />
  );
}
