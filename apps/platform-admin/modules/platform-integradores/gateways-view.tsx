"use client";

import type { PlatformPaymentGatewayRow } from "@boilerplate/db";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toggleGatewayAction } from "./actions";

export function GatewaysView({
  gateways,
  canEdit,
}: {
  gateways: PlatformPaymentGatewayRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(g: PlatformPaymentGatewayRow, patch: { ativo?: boolean; isDefault?: boolean }) {
    if (!canEdit) return;
    setError(null);
    startTransition(async () => {
      try {
        await toggleGatewayAction({
          integratorId: g.integratorId,
          label: g.label,
          ativo: patch.ativo ?? g.ativo,
          isDefault: patch.isDefault,
        });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Gateways de pagamento habilitados na plataforma. Credenciais ficam em
        variáveis de ambiente. Veja o{" "}
        <a href="/integradores" className="underline hover:text-foreground">
          catálogo completo de integradores
        </a>
        .
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {gateways.map((g) => (
          <Card key={g.integratorId}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{g.label}</CardTitle>
                <div className="flex gap-1">
                  {g.isDefault ? (
                    <Badge>Padrão</Badge>
                  ) : null}
                  <Badge variant={g.ativo ? "default" : "secondary"}>
                    {g.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
              <CardDescription className="font-mono text-xs">
                {g.integratorId}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              {canEdit ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => toggle(g, { ativo: !g.ativo })}
                  >
                    {g.ativo ? "Desativar" : "Ativar"}
                  </Button>
                  {!g.isDefault ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={pending || !g.ativo}
                      onClick={() => toggle(g, { isDefault: true, ativo: true })}
                    >
                      Definir padrão
                    </Button>
                  ) : null}
                </>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
