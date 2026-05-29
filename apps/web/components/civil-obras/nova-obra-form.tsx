"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ObraStatus } from "@boilerplate/civil-obras";
import { createCivilObraAction } from "@/app/actions/civil-obras";
import { CIVIL_OBRAS_ROUTES } from "@/lib/civil-obras-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NovaObraForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const obra = await createCivilObraAction({
        nome: String(fd.get("nome") ?? ""),
        endereco: String(fd.get("endereco") ?? ""),
        dataInicio: String(fd.get("dataInicio") ?? ""),
        dataPrevistaConclusao: String(fd.get("dataPrevista") ?? "") || null,
        status: (fd.get("status") as ObraStatus) ?? "planejada",
      });
      router.push(CIVIL_OBRAS_ROUTES.obra(obra.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar obra");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      <div>
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" name="nome" required />
      </div>
      <div>
        <Label htmlFor="endereco">Endereço</Label>
        <Input id="endereco" name="endereco" required />
      </div>
      <div>
        <Label htmlFor="dataInicio">Data de início</Label>
        <Input id="dataInicio" name="dataInicio" type="date" required />
      </div>
      <div>
        <Label htmlFor="dataPrevista">Previsão de conclusão</Label>
        <Input id="dataPrevista" name="dataPrevista" type="date" />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          defaultValue="planejada"
        >
          <option value="planejada">Planejada</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
          <option value="paralisada">Paralisada</option>
        </select>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Cadastrar obra"}
      </Button>
    </form>
  );
}
