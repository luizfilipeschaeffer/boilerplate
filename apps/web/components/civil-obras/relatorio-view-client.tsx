"use client";

import { useState } from "react";
import type { RelatorioListagem } from "@boilerplate/civil-obras";
import {
  exportRelatorioPdfAction,
  getRelatorioListagemAction,
} from "@/app/actions/civil-obras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RelatorioViewClient({ obraId }: { obraId: string }) {
  const [listagem, setListagem] = useState<RelatorioListagem | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function gerar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const inicio = String(fd.get("inicio") ?? "");
    const fim = String(fd.get("fim") ?? "");
    const data = await getRelatorioListagemAction(obraId, inicio, fim);
    setListagem(data);
    setLoading(false);
  }

  async function exportarPdf() {
    if (!listagem) return;
    setLoading(true);
    const rel = await exportRelatorioPdfAction(
      obraId,
      listagem.periodoInicio,
      listagem.periodoFim,
    );
    setPdfUrl(rel.pdfUrl);
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={gerar} className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="inicio">Início</Label>
          <Input id="inicio" name="inicio" type="date" required />
        </div>
        <div>
          <Label htmlFor="fim">Fim</Label>
          <Input id="fim" name="fim" type="date" required />
        </div>
        <Button type="submit" disabled={loading}>
          Visualizar
        </Button>
      </form>
      {listagem ? (
        <>
          <p className="text-muted-foreground text-sm">
            {listagem.entradas.length} entrada(s) no período
          </p>
          <ul className="divide-y rounded-md border">
            {listagem.entradas.map((e) => (
              <li key={e.id} className="p-3">
                <p className="font-medium">{e.titulo}</p>
                <p className="text-muted-foreground text-xs">
                  {e.dataRegistro.slice(0, 10)} · {e.autorNome} · {e.midiaCount} mídia(s)
                </p>
              </li>
            ))}
          </ul>
          <Button onClick={exportarPdf} disabled={loading}>
            Exportar PDF
          </Button>
          {pdfUrl ? (
            <a href={pdfUrl} className="text-primary text-sm underline" target="_blank" rel="noreferrer">
              Download PDF (válido 24h)
            </a>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
