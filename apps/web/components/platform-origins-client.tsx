"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  initialOrigins: string[];
  saveAction: (origins: string[]) => Promise<{ ok: boolean; error?: string; origins?: string[] }>;
};

export function PlatformOriginsClient({ initialOrigins, saveAction }: Props) {
  const [origins, setOrigins] = useState(
    initialOrigins.length ? initialOrigins : [""],
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domínios permitidos</CardTitle>
        <CardDescription>
          Apenas estes endereços podem acessar recursos desta instalação self-hosted.
          Sincronizado com a plataforma central quando possível.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {origins.map((o, i) => (
          <Input
            key={i}
            placeholder="erp.suaempresa.com.br ou *.suaempresa.com.br"
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
            startTransition(async () => {
              const r = await saveAction(origins.filter(Boolean));
              if (!r.ok) setMessage(r.error ?? "Erro");
              else {
                setMessage("Domínios atualizados. Reinicie o web se usar ALLOWED_HOSTS no .env.");
                if (r.origins?.length) setOrigins(r.origins);
              }
            })
          }
        >
          Salvar
        </Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}
