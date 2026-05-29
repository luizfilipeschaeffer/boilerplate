"use client";

import type { MarketplaceModule } from "@boilerplate/platform-api";
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

type Props = {
  modules: MarketplaceModule[];
  installAction: (moduleId: string) => Promise<{ ok: boolean; message?: string; code?: string }>;
};

export function PlatformModulesClient({ modules, installAction }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Módulos adicionais</CardTitle>
          <CardDescription>
            Instale módulos autorizados pela sua licença diretamente nesta instalação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          {modules.map((m) => (
            <div
              key={m.id}
              className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-muted-foreground">{m.description}</p>
                <div className="mt-1 flex gap-1">
                  <Badge variant="outline">{m.status}</Badge>
                  <Badge variant="secondary">v{m.currentVersion}</Badge>
                </div>
              </div>
              <Button
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await installAction(m.id);
                    setMessage(
                      r.ok ? `Módulo ${m.id} instalado.` : (r.message ?? r.code ?? "Erro"),
                    );
                  })
                }
              >
                Instalar
              </Button>
            </div>
          ))}
          {modules.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum módulo disponível para sua licença atual.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
