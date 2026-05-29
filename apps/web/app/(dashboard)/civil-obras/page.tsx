import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ObrasListClient } from "@/components/civil-obras/obras-list-client";
import { listCivilObrasAction } from "@/app/actions/civil-obras";
import {
  canAdminCivilObras,
  canViewCivilObras,
} from "@/lib/civil-obras-access";
import { getActiveModuleIds } from "@/lib/modules/active-modules";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CivilObrasPage() {
  const session = await auth();
  if (!session?.organizationId) redirect("/login");

  const role = session.role ?? "dono";
  const activeIds = await getActiveModuleIds(
    session.organizationId,
    session.sectorId ?? "geral",
    role,
    session.user?.id,
  );

  if (!activeIds.includes("civil-obras")) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestão de Obras</CardTitle>
            <CardDescription>Módulo não ativo para este setor.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!canViewCivilObras(role)) redirect("/dashboard");

  const obras = await listCivilObrasAction();

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Obras</CardTitle>
          <CardDescription>Obras, diário de campo e relatórios.</CardDescription>
        </CardHeader>
        <CardContent>
          <ObrasListClient obras={obras} canAdmin={canAdminCivilObras(role)} />
        </CardContent>
      </Card>
    </div>
  );
}
