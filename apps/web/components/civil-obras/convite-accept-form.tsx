"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptCivilObraInviteAction } from "@/app/actions/civil-obras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ConviteAcceptForm({
  token,
  schemaName,
  nome,
  email,
}: {
  token: string;
  schemaName: string;
  nome: string;
  email: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await acceptCivilObraInviteAction({
      token,
      schemaName,
      senha: String(fd.get("senha") ?? ""),
    });
    if (!res.ok) {
      setError("error" in res ? res.error : "Falha ao aceitar convite");
      return;
    }
    router.push(`/civil-obras/obra/${res.obraId}/diario`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p className="text-sm">
        Olá <strong>{nome}</strong> ({email})
      </p>
      <div>
        <Label htmlFor="senha">Defina sua senha</Label>
        <Input id="senha" name="senha" type="password" minLength={8} required />
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button type="submit">Acessar obra</Button>
    </form>
  );
}
