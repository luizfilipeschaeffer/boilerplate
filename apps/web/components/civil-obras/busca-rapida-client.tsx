"use client";

import { useState } from "react";
import type { BuscaResultado } from "@boilerplate/civil-obras";
import { buscarCivilObrasAction } from "@/app/actions/civil-obras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BuscaRapidaClient({ obraId }: { obraId: string }) {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<BuscaResultado | null>(null);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setResult(await buscarCivilObrasAction(obraId, q));
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={buscar} className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar entradas, usuários…"
        />
        <Button type="submit">Buscar</Button>
      </form>
      {result ? (
        <div className="text-sm">
          <p className="font-medium">{result.entradas.length} entradas</p>
          <ul className="mt-2 list-disc pl-5">
            {result.entradas.map((e) => (
              <li key={e.id}>{e.titulo}</li>
            ))}
          </ul>
          {result.usuarios.length ? (
            <>
              <p className="mt-4 font-medium">Usuários</p>
              <ul className="list-disc pl-5">
                {result.usuarios.map((u) => (
                  <li key={u.id}>{u.nome}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
