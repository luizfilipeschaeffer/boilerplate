import { AuthPanel } from "@/components/auth-panel";
import { normalizeEmailParam } from "@/lib/mask-email";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const initialEmail = normalizeEmailParam(params.email) ?? "";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-md">
        <AuthPanel initialEmail={initialEmail} />
      </div>
    </div>
  );
}
