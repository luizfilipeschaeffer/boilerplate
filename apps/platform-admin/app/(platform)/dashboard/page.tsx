import {
  getInsightsDemanda,
  listOrganizationsForAdmin,
  prisma,
} from "@boilerplate/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLATFORM_ROLE_LABELS } from "@/lib/rbac";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function PlatformDashboardPage() {
  const session = await auth();
  const [orgs, demandas] = await Promise.all([
    listOrganizationsForAdmin(),
    getInsightsDemanda(),
  ]);
  const usersCount = await prisma.user.count();

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Olá, {session?.user?.name ?? "operador"} —{" "}
          {session?.user?.platformRole
            ? PLATFORM_ROLE_LABELS[session.user.platformRole]
            : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Organizações</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{orgs.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Tenants ativos na plataforma
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuários SaaS</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{usersCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Contas em todas as organizações
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <CardDescription>Demanda de módulos</CardDescription>
            <CardTitle className="text-base font-medium">
              Top interesses (onboarding)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {demandas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum registro em modulo_demanda ainda.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {demandas.slice(0, 6).map((d) => (
                  <li key={d.moduloId} className="flex justify-between gap-4">
                    <span>{d.moduloId}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {d.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
