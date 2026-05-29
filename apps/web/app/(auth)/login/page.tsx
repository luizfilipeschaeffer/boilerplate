import { Suspense } from "react";
import { resolveAuthMode } from "@boilerplate/platform-api";

import { AuthPanel } from "@/components/auth-panel";
import { StripAuthSearchParams } from "@/components/strip-auth-search-params";
import { normalizeEmailParam } from "@/lib/mask-email";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string;
    reason?: string;
    primeiroAcesso?: string;
    callbackUrl?: string;
  }>;
}) {
  const params = await searchParams;
  const initialEmail = normalizeEmailParam(params.email) ?? "";
  const inactivityLogout = params.reason === "inactivity";
  const firstAccessHint = params.primeiroAcesso === "1";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <Suspense fallback={null}>
        <StripAuthSearchParams />
      </Suspense>
      <div className="w-full max-w-md">
        <AuthPanel
          initialEmail={initialEmail}
          inactivityLogout={inactivityLogout}
          firstAccessHint={firstAccessHint}
          authMode={resolveAuthMode()}
          callbackUrl={params.callbackUrl}
        />
      </div>
    </div>
  );
}
