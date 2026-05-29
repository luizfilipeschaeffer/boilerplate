import "server-only";

import type { EntradaDetail, ObraSummary } from "@boilerplate/civil-obras";

/** Gera PDF simples em buffer (texto) para relatório MVP sem dependência pesada no cliente. */
export function buildRelatorioPdfBuffer(
  obra: ObraSummary,
  entradas: EntradaDetail[],
  periodoInicio: string,
  periodoFim: string,
): Buffer {
  const lines: string[] = [
    "RELATÓRIO DE ANDAMENTO — GESTÃO DE OBRAS",
    "",
    `Obra: ${obra.nome}`,
    `Endereço: ${obra.endereco}`,
    `Status: ${obra.status}`,
    `Período: ${periodoInicio} a ${periodoFim}`,
    "",
    "---",
    "",
  ];

  for (const e of entradas) {
    lines.push(`Data: ${e.dataRegistro.slice(0, 10)}`);
    lines.push(`Título: ${e.titulo}`);
    lines.push(`Autor: ${e.autorNome}`);
    const texto =
      typeof e.corpo === "object" && e.corpo && "text" in e.corpo
        ? String((e.corpo as { text?: string }).text ?? "")
        : JSON.stringify(e.corpo).slice(0, 500);
    lines.push(`Conteúdo: ${texto}`);
    if (e.midias.length) {
      lines.push("Mídias:");
      for (const m of e.midias) {
        lines.push(
          `  - ${m.tipo}: ${m.nomeOriginal} ${m.tipo === "video" ? "(thumbnail)" : ""} ${m.urlStorage}`,
        );
      }
    }
    lines.push("");
  }

  const content = lines.join("\n");
  const header = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${content.length + 50}>>stream
BT /F1 10 Tf 50 750 Td (${content.replace(/[()\\]/g, " ").slice(0, 3000)}) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f 
trailer<</Size 6/Root 1 0 R>>
startxref
0
%%EOF`;
  return Buffer.from(header, "utf-8");
}
