import { getSubscriptionAction } from "@/app/actions/platform-account";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ContaPage() {
  const sub = await getSubscriptionAction();

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Conta e assinatura</CardTitle>
          <CardDescription>
            Plano contratado na plataforma central Boilerplate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sub ? (
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar a assinatura. Tente novamente mais tarde.
            </p>
          ) : (
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Plano</dt>
                <dd>{sub.planName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge>{sub.status}</Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Expira em</dt>
                <dd>
                  {sub.expiresAt
                    ? new Date(sub.expiresAt).toLocaleDateString("pt-BR")
                    : "—"}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
