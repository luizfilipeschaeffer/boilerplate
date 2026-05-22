import {
  getNextImprovementsForOrg,
  getPublicChangelog,
  getSectorProgressForOrg,
} from "@boilerplate/db";
import { auth } from "@/auth";
import { resolveUserSetup } from "@/lib/session-setup";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function SectorProgressBar({
  name,
  progressPct,
  moduleCount,
}: {
  name: string;
  progressPct: number;
  moduleCount: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground">
          {progressPct}% · {moduleCount}{" "}
          {moduleCount === 1 ? "módulo" : "módulos"}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

export default async function EvolucaoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const setup = await resolveUserSetup(session.user.id);
  const orgId = setup.organizationId ?? session.organizationId;
  if (!orgId) redirect("/onboarding");

  const [sectors, improvements, changelog] = await Promise.all([
    getSectorProgressForOrg(orgId),
    getNextImprovementsForOrg(orgId),
    getPublicChangelog(10),
  ]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Evolução da plataforma</CardTitle>
          <CardDescription>
            A plataforma evolui em camadas; você não precisa trocar de sistema —
            os mesmos dados ganham novas capacidades conforme seu negócio cresce.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seu caminho por área</CardTitle>
          <CardDescription>
            Progresso médio dos módulos ativos em cada área da sua empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {sectors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ative módulos no onboarding para ver o progresso por área.
            </p>
          ) : (
            sectors.map((s) => (
              <SectorProgressBar
                key={s.sectorSlug}
                name={s.sectorName}
                progressPct={s.progressPct}
                moduleCount={s.moduleCount}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximas melhorias</CardTitle>
          <CardDescription>
            Capacidades que ainda podem evoluir nos módulos que você já usa.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {improvements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Seus módulos ativos estão no nível alvo atual — novidades virão em
              próximas atualizações da plataforma.
            </p>
          ) : (
            improvements.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.sectorName}
                  </p>
                </div>
                <span className="text-muted-foreground">
                  Nível {item.depthCurrent} de {item.depthTarget}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">O que melhorou recentemente</CardTitle>
          <CardDescription>
            Novidades já disponíveis para todos os clientes da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {changelog.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Em breve publicaremos as próximas melhorias aqui.
            </p>
          ) : (
            changelog.map((entry) => (
              <div
                key={entry.id}
                className="border-b pb-4 last:border-0 last:pb-0"
              >
                <p className="font-medium">{entry.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {entry.publicSummary}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {entry.moduleName} ·{" "}
                  {new Date(entry.releasedAt).toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
