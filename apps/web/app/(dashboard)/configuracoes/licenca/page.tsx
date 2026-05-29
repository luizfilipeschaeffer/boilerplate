import {
  getLicenseStatusAction,
  getSubscriptionAction,
} from "@/app/actions/platform-account";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function LicencaPage() {
  const license = await getLicenseStatusAction();

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Licença da plataforma</CardTitle>
          <CardDescription>
            Entitlements ativos sincronizados com a conta central.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!license ? (
            <p className="text-sm text-muted-foreground">
              Licença não disponível. Verifique conexão com a plataforma central.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge>Plano: {license.plan}</Badge>
                <Badge variant={license.status === "active" ? "default" : "secondary"}>
                  {license.status}
                </Badge>
                <Badge variant="outline">
                  Expira: {new Date(license.expiresAt).toLocaleDateString("pt-BR")}
                </Badge>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Limites</p>
                <ul className="text-sm text-muted-foreground">
                  <li>Usuários: {license.limits.users}</li>
                  <li>Filiais: {license.limits.branches}</li>
                  <li>Módulos: {license.limits.modules}</li>
                  <li>Organizações: {license.limits.organizations}</li>
                </ul>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Entitlements</p>
                <div className="flex flex-wrap gap-1">
                  {license.entitlements.map((e) => (
                    <Badge key={e} variant="secondary">
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
