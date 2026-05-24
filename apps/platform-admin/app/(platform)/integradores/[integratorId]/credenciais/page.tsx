import Link from "next/link";
import { notFound } from "next/navigation";
import { IntegratorCredentialsForm } from "@/modules/platform-integradores/integrator-credentials-form";
import { loadIntegratorCredentialPage } from "@/modules/platform-integradores/credential-actions";
import { buttonVariants } from "@/components/ui/button";

export default async function IntegradorCredenciaisPage({
  params,
}: {
  params: Promise<{ integratorId: string }>;
}) {
  const { integratorId } = await params;
  const data = await loadIntegratorCredentialPage(integratorId);
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/integradores"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "w-fit" })}
      >
        ← Voltar ao catálogo
      </Link>
      <IntegratorCredentialsForm
        integratorId={data.integratorId}
        label={data.label}
        fields={data.fields}
        initialStatus={data.status}
        canEdit={data.canEdit}
      />
    </div>
  );
}
