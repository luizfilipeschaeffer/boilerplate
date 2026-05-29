import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RelatorioViewClient } from "@/components/civil-obras/relatorio-view-client";
import { ObraNav } from "@/components/civil-obras/obra-nav";
import { canViewCivilObras } from "@/lib/civil-obras-access";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RelatorioPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const session = await auth();
  if (!session?.organizationId) redirect("/login");
  if (!canViewCivilObras(session.role ?? "dono")) redirect("/dashboard");

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Relatório de andamento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ObraNav obraId={obraId} />
          <RelatorioViewClient obraId={obraId} />
        </CardContent>
      </Card>
    </div>
  );
}
