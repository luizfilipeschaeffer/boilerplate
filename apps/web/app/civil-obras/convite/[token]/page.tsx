import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConviteAcceptForm } from "@/components/civil-obras/convite-accept-form";
import { resolveInviteTokenAction } from "@/app/actions/civil-obras";
import { prisma } from "@boilerplate/db";

export const dynamic = "force-dynamic";

export default async function ConvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ org?: string }>;
}) {
  const { token } = await params;
  const { org: orgId } = await searchParams;

  let schemaName = "tenant_default";
  if (orgId) {
    const membership = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { schemaName: true },
    });
    if (membership?.schemaName) schemaName = membership.schemaName;
  }

  const invite = await resolveInviteTokenAction(schemaName, token);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Convite — Gestão de Obras</CardTitle>
        </CardHeader>
        <CardContent>
          {!invite || invite.revoked || invite.expired ? (
            <p className="text-muted-foreground text-sm">
              Convite inválido, expirado ou revogado.
            </p>
          ) : (
            <ConviteAcceptForm
              token={token}
              schemaName={schemaName}
              nome={invite.nome}
              email={invite.email}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
