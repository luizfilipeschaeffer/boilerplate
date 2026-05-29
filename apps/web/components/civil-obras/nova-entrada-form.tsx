"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCivilObraEntradaAction } from "@/app/actions/civil-obras";
import { CIVIL_OBRAS_ROUTES } from "@/lib/civil-obras-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function NovaEntradaForm({
  obraId,
  mencaoUsuarioIds,
}: {
  obraId: string;
  mencaoUsuarioIds?: string[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const texto = String(fd.get("corpo") ?? "");
    await createCivilObraEntradaAction({
      obraId,
      titulo: String(fd.get("titulo") ?? ""),
      corpo: { type: "doc", text: texto },
      dataRegistro: new Date(String(fd.get("dataRegistro") ?? "")).toISOString(),
      mencaoUsuarioIds: mencaoUsuarioIds ?? [],
    });
    router.push(CIVIL_OBRAS_ROUTES.diario(obraId));
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      <div>
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" name="titulo" required />
      </div>
      <div>
        <Label htmlFor="dataRegistro">Data do registro</Label>
        <Input
          id="dataRegistro"
          name="dataRegistro"
          type="datetime-local"
          required
          defaultValue={new Date().toISOString().slice(0, 16)}
        />
      </div>
      <div>
        <Label htmlFor="corpo">Conteúdo</Label>
        <Textarea id="corpo" name="corpo" rows={8} required />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Publicando…" : "Publicar entrada"}
      </Button>
    </form>
  );
}
