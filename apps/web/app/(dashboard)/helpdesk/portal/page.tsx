import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HelpdeskPortalClient } from "@/components/helpdesk/helpdesk-portal-client";
import { getActiveModuleIds } from "@/lib/modules/active-modules";
import { roleHasModulePermission } from "@/lib/module-permissions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@boilerplate/db";

export const dynamic = "force-dynamic";

export default async function HelpdeskPortalPage() {
  const session = await auth();
  if (!session?.organizationId) redirect("/login");

  const role = session.role ?? "dono";
  const sectorSlug = session.sectorId ?? "geral";
  const activeIds = await getActiveModuleIds(
    session.organizationId,
    sectorSlug,
    role,
    session.user?.id,
  );
  if (!activeIds.includes("crm-helpdesk")) redirect("/helpdesk");
  if (!roleHasModulePermission(role, "crm-helpdesk", "ver")) {
    redirect("/dashboard");
  }

  const sector = await prisma.sector.findFirst({
    where: { organizationId: session.organizationId, slug: sectorSlug },
    select: { id: true },
  });

  const canEdit = roleHasModulePermission(role, "crm-helpdesk", "registrar");

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Portal de suporte</CardTitle>
          <CardDescription>
            Deflexão via Aprendiz antes de abrir um chamado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HelpdeskPortalClient
            canEdit={canEdit}
            sectorId={sector?.id ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
