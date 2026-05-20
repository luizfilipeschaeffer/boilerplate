export interface AutomacaoTemplate {
  id: string;
  nome: string;
  descricao: string;
}

export const TEMPLATES_FASE_1: AutomacaoTemplate[] = [
  {
    id: "estoque-baixo",
    nome: "Alerta de estoque baixo",
    descricao: "Avisa quando o estoque de um item ficar abaixo do mínimo.",
  },
  {
    id: "venda-desconta-estoque",
    nome: "Descontar estoque na venda",
    descricao: "Ao confirmar venda, baixa automaticamente o estoque.",
  },
];
