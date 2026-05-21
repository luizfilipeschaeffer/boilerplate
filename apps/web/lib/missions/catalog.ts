export type MissionId =
  | "primeiro_cliente"
  | "primeiro_produto"
  | "primeira_venda"
  | "ver_estoque"
  | "conhecer_aprendiz";

export type MissionKind = "data" | "visit";

export type MissionDef = {
  id: MissionId;
  title: string;
  description: string;
  href: string;
  cta: string;
  kind: MissionKind;
  /** Contagem no tenant para concluir automaticamente. */
  dataKey?: "clients" | "catalog" | "sales";
};

/** Primeiros passos — linguagem simples, sem jargão de plataforma. */
export const FASE1_MISSIONS: MissionDef[] = [
  {
    id: "primeiro_cliente",
    title: "Cadastre um cliente",
    description: "Quem compra de você — pode ser pessoa ou empresa.",
    href: "/clientes?novo=1",
    cta: "Adicionar cliente",
    kind: "data",
    dataKey: "clients",
  },
  {
    id: "primeiro_produto",
    title: "Cadastre um produto ou serviço",
    description: "O que você vende, com preço para usar nas vendas.",
    href: "/catalogo?novo=1",
    cta: "Adicionar item",
    kind: "data",
    dataKey: "catalog",
  },
  {
    id: "primeira_venda",
    title: "Registre uma venda",
    description: "Uma venda de teste já ajuda a ver como o painel funciona.",
    href: "/vendas?novo=1",
    cta: "Registrar venda",
    kind: "data",
    dataKey: "sales",
  },
  {
    id: "ver_estoque",
    title: "Confira o estoque",
    description: "Veja como acompanhar quantidade do que você vende.",
    href: "/estoque",
    cta: "Ver estoque",
    kind: "visit",
  },
  {
    id: "conhecer_aprendiz",
    title: "Fale com o Aprendiz",
    description: "Seu assiste no dia a dia — automações e dicas do seu jeito.",
    href: "/aprendiz",
    cta: "Abrir Aprendiz",
    kind: "visit",
  },
];

export function firstNameFrom(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "você";
}
