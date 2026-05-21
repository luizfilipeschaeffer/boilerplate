/** Respostas do Aprendiz no painel (Fase 1 — regras simples, sem LLM). */
export function responderMensagemAprendiz(
  text: string,
  ctx: { ownerFirstName?: string; negocioNome?: string },
): string {
  const q = text.trim().toLowerCase();
  const nome = ctx.ownerFirstName ?? "você";

  if (!q) {
    return "Pode escrever sua dúvida — estou aqui para ajudar no dia a dia do negócio.";
  }

  if (/^(oi|olá|ola|hey|bom dia|boa tarde|boa noite)\b/.test(q)) {
    return `Olá, ${nome}! Como posso ajudar hoje? Você pode falar de vendas, estoque, clientes ou automações.`;
  }

  if (q.includes("estoque")) {
    return "No menu Estoque você vê quantidades e alertas. Se ativar a automação “Alerta de estoque baixo”, eu aviso quando um produto ficar abaixo do mínimo.";
  }

  if (q.includes("venda") || q.includes("vender")) {
    return "Em Vendas você registra cada venda com cliente, item e pagamento. Com “Descontar estoque na venda” ligada, o estoque baixa sozinho ao confirmar.";
  }

  if (q.includes("cliente")) {
    return "Em Clientes você cadastra quem compra de você. Na hora da venda, é só escolher o cliente na lista.";
  }

  if (
    q.includes("automa") ||
    q.includes("regra") ||
    q.includes("template")
  ) {
    return "As automações ficam logo acima do campo de mensagem. Ligue ou desligue cada uma — eu executo em segundo plano quando estiverem ativas.";
  }

  if (q.includes("catálogo") || q.includes("catalogo") || q.includes("produto")) {
    return "No Catálogo você cadastra produtos e serviços com preço. Eles aparecem ao registrar uma venda.";
  }

  if (q.includes("obrigad")) {
    return "Por nada! Sigo aprendendo com cada venda e movimento que você registrar.";
  }

  if (ctx.negocioNome && (q.includes("negócio") || q.includes("negocio"))) {
    return `Estou acompanhando o ${ctx.negocioNome} com você. Quanto mais você usar vendas e estoque, mais contexto eu ganho.`;
  }

  return "Ainda estou na Fase 1 — consigo ajudar com vendas, estoque, clientes e automações do painel. Tente perguntar sobre um desses temas.";
}
