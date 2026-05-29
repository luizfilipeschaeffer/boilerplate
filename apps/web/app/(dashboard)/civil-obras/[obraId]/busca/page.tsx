import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BuscaRapidaClient } from "@/components/civil-obras/busca-rapida-client";
import { ObraNav } from "@/components/civil-obras/obra-nav";
import { canViewCivilObras } from "@/lib/civil-obras-access";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BuscaPage({
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
          <CardTitle>Busca rápida</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ObraNav obraId={obraId} />
          <BuscaRapidaClient obraId={obraId} />
        </CardContent>
      </Card>
    </div>
  );
}
