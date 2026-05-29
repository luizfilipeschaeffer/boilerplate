import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarioObraClient } from "@/components/civil-obras/calendario-obra-client";
import { ObraNav } from "@/components/civil-obras/obra-nav";
import { listCivilObraEventosAction } from "@/app/actions/civil-obras";
import { canViewCivilObras } from "@/lib/civil-obras-access";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CalendarioPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const session = await auth();
  if (!session?.organizationId) redirect("/login");
  if (!canViewCivilObras(session.role ?? "dono")) redirect("/dashboard");

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();
  const eventos = await listCivilObraEventosAction(obraId, { start, end });

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendário</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ObraNav obraId={obraId} />
          <CalendarioObraClient obraId={obraId} eventos={eventos} />
        </CardContent>
      </Card>
    </div>
  );
}
