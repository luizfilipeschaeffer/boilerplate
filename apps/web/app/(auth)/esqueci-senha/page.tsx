import { redirect } from "next/navigation";

import { EsqueciSenhaForm } from "@/components/esqueci-senha-form";
import { normalizeEmailParam } from "@/lib/mask-email";

function parseCodeParam(code: string | undefined): string {
  return code?.replace(/\D/g, "").slice(0, 6) ?? "";
}

export default async function EsqueciSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; code?: string; copiar?: string }>;
}) {
  const params = await searchParams;
  const email = normalizeEmailParam(params.email);
  if (!email) {
    redirect("/login");
  }

  const initialCode = parseCodeParam(params.code);
  const autoCopy = params.copiar === "1" && initialCode.length === 6;

  return (
    <EsqueciSenhaForm
      email={email}
      initialCode={initialCode}
      autoCopy={autoCopy}
      skipSendEmail={initialCode.length === 6}
    />
  );
}
