import { Suspense } from "react";

import { AuthPanel } from "@/components/auth-panel";
import { StripAuthSearchParams } from "@/components/strip-auth-search-params";
import { normalizeEmailParam } from "@/lib/mask-email";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const initialEmail = normalizeEmailParam(params.email) ?? "";
  const inactivityLogout = params.reason === "inactivity";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <Suspense fallback={null}>
        <StripAuthSearchParams />
      </Suspense>
      <div className="w-full max-w-md">
        <AuthPanel
          initialEmail={initialEmail}
          inactivityLogout={inactivityLogout}
        />
      </div>
    </div>
  );
}
