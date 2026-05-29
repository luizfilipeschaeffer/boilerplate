import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ObraNav } from "@/components/civil-obras/obra-nav";
import { listCivilObraEntradasAction } from "@/app/actions/civil-obras";
import {
  canColaboradorCivilObras,
  canViewCivilObras,
  CIVIL_OBRAS_ROUTES,
} from "@/lib/civil-obras-access";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DiarioPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const session = await auth();
  if (!session?.organizationId) redirect("/login");
  const role = session.role ?? "dono";
  if (!canViewCivilObras(role)) redirect("/dashboard");

  const entradas = await listCivilObraEntradasAction(obraId);
  const canWrite =
    canColaboradorCivilObras(role) || role === "dono" || role === "gerente";

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Diário de obra</CardTitle>
          {canWrite ? (
            <Button asChild size="sm">
              <Link href={CIVIL_OBRAS_ROUTES.diarioNova(obraId)}>Nova entrada</Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ObraNav obraId={obraId} />
          <ul className="divide-y rounded-md border">
            {entradas.map((e) => (
              <li key={e.id} className="p-3">
                <p className="font-medium">{e.titulo}</p>
                <p className="text-muted-foreground text-xs">
                  {e.dataRegistro.slice(0, 16)} · {e.autorNome} · {e.midiaCount}{" "}
                  mídia(s)
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
