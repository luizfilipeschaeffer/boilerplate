import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsuariosObraClient } from "@/components/civil-obras/usuarios-obra-client";
import { ObraNav } from "@/components/civil-obras/obra-nav";
import { listCivilObraUsuariosAction } from "@/app/actions/civil-obras";
import { canAdminCivilObras } from "@/lib/civil-obras-access";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UsuariosObraPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const session = await auth();
  if (!session?.organizationId) redirect("/login");
  if (!canAdminCivilObras(session.role ?? "dono")) redirect(`/civil-obras/${obraId}`);

  const usuarios = await listCivilObraUsuariosAction(obraId);

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Usuários da obra</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ObraNav obraId={obraId} />
          <UsuariosObraClient obraId={obraId} usuarios={usuarios} />
        </CardContent>
      </Card>
    </div>
  );
}
