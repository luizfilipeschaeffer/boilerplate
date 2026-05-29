import { checkUpdatesAction } from "@/app/actions/platform-account";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AtualizacoesPage() {
  const updates = await checkUpdatesAction();

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Atualizações</CardTitle>
          <CardDescription>
            Versões disponíveis da plataforma para esta instalação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Versão atual: <Badge variant="outline">{updates.currentVersion}</Badge>
          </p>
          {updates.available && updates.latestVersion ? (
            <>
              <p>
                Nova versão: <Badge>{updates.latestVersion}</Badge>
              </p>
              {updates.changelog ? (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {updates.changelog}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground">Nenhuma atualização disponível.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
