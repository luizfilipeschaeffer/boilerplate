import { prisma } from "@boilerplate/db";
import { setCentralAllowedOrigins } from "@boilerplate/db/self-hosted";
import { PlatformInstallationOriginsForm } from "@/components/platform-installation-origins-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function InstalacaoDetailPage({ params }: Props) {
  const { id } = await params;
  const inst = await prisma.selfHostedInstallation.findUnique({
    where: { id },
    include: { organization: { select: { name: true } } },
  });
  if (!inst) {
    return <p className="p-6 text-muted-foreground">Instalação não encontrada.</p>;
  }
  const origins = Array.isArray(inst.allowedOrigins)
    ? (inst.allowedOrigins as string[])
    : [];

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <h1 className="text-xl font-semibold">{inst.name}</h1>
      <p className="text-muted-foreground text-sm">{inst.organization.name}</p>
      <PlatformInstallationOriginsForm
        installationId={inst.id}
        initialOrigins={origins}
        saveAction={saveOriginsForInstallation}
      />
    </div>
  );
}

async function saveOriginsForInstallation(installationId: string, origins: string[]) {
  "use server";
  await setCentralAllowedOrigins(installationId, origins);
  return { ok: true as const };
}
