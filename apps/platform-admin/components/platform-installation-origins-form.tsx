"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  installationId: string;
  initialOrigins: string[];
  saveAction: (installationId: string, origins: string[]) => Promise<{ ok: boolean }>;
};

export function PlatformInstallationOriginsForm({
  installationId,
  initialOrigins,
  saveAction,
}: Props) {
  const [origins, setOrigins] = useState(initialOrigins.length ? initialOrigins : [""]);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domínios permitidos</CardTitle>
        <CardDescription>
          Hosts autorizados a acessar a instalação {installationId.slice(0, 8)}…
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {origins.map((o, i) => (
          <Input
            key={i}
            value={o}
            onChange={(e) => {
              const next = [...origins];
              next[i] = e.target.value;
              setOrigins(next);
            }}
          />
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => setOrigins([...origins, ""])}>
          + Adicionar
        </Button>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              void saveAction(installationId, origins.filter(Boolean));
            })
          }
        >
          Salvar domínios
        </Button>
      </CardContent>
    </Card>
  );
}
