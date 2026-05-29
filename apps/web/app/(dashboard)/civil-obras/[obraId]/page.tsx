import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ObraNav } from "@/components/civil-obras/obra-nav";
import { getCivilObraAction } from "@/app/actions/civil-obras";
import { canViewCivilObras } from "@/lib/civil-obras-access";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ObraDetailPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const session = await auth();
  if (!session?.organizationId) redirect("/login");
  if (!canViewCivilObras(session.role ?? "dono")) redirect("/dashboard");

  const obra = await getCivilObraAction(obraId);
  if (!obra) notFound();

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>{obra.nome}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ObraNav obraId={obraId} />
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Endereço</dt>
              <dd>{obra.endereco}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>{obra.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Início</dt>
              <dd>{obra.dataInicio}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Previsão</dt>
              <dd>{obra.dataPrevistaConclusao ?? "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
