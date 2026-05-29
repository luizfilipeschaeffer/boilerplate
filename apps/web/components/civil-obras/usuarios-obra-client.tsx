"use client";

import { useState } from "react";
import type { UsuarioObraSummary } from "@boilerplate/civil-obras";
import {
  inviteCivilObraUsuarioAction,
  revokeCivilObraUsuarioAction,
} from "@/app/actions/civil-obras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UsuariosObraClient({
  obraId,
  usuarios: initial,
}: {
  obraId: string;
  usuarios: UsuarioObraSummary[];
}) {
  const [usuarios, setUsuarios] = useState(initial);
  const [link, setLink] = useState<string | null>(null);

  async function convidar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await inviteCivilObraUsuarioAction({
      obraId,
      nome: String(fd.get("nome") ?? ""),
      email: String(fd.get("email") ?? ""),
      telefone: String(fd.get("telefone") ?? "") || null,
      perfil: (fd.get("perfil") as "colaborador" | "visualizador") ?? "colaborador",
      optInWhatsapp: fd.get("whatsapp") === "on",
    });
    setLink(res.conviteLink);
    e.currentTarget.reset();
  }

  async function revogar(usuarioId: string) {
    await revokeCivilObraUsuarioAction(obraId, usuarioId);
    setUsuarios((u) =>
      u.map((x) =>
        x.id === usuarioId ? { ...x, revokedAt: new Date().toISOString() } : x,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={convidar} className="flex max-w-md flex-col gap-3 rounded-md border p-4">
        <h3 className="font-medium">Convidar usuário</h3>
        <div>
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" required />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
          <Input id="telefone" name="telefone" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="whatsapp" />
          Opt-in WhatsApp
        </label>
        <div>
          <Label htmlFor="perfil">Perfil</Label>
          <select
            id="perfil"
            name="perfil"
            className="border-input w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="colaborador">Colaborador</option>
            <option value="visualizador">Visualizador</option>
          </select>
        </div>
        <Button type="submit">Enviar convite</Button>
        {link ? (
          <p className="text-muted-foreground break-all text-xs">Link: {link}</p>
        ) : null}
      </form>
      <ul className="divide-y rounded-md border">
        {usuarios.map((u) => (
          <li key={u.id} className="flex items-center justify-between p-3 text-sm">
            <div>
              <p className="font-medium">{u.nome}</p>
              <p className="text-muted-foreground">{u.email} · {u.perfil}</p>
            </div>
            {!u.revokedAt ? (
              <Button variant="outline" size="sm" onClick={() => revogar(u.id)}>
                Revogar
              </Button>
            ) : (
              <span className="text-muted-foreground">Revogado</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
