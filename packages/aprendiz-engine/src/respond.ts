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

  if (q.includes("fluxo") || q.includes("caixa")) {
    return "No Fluxo de caixa você registra entradas e saídas. Vendas confirmadas entram automaticamente; contas a pagar ficam como saídas previstas com vencimento.";
  }

  if (q.includes("vendedor") || q.includes("comiss")) {
    return "Em Vendedores você cadastra a equipe. Na hora da venda, escolha o vendedor — o relatório mostra desempenho por pessoa.";
  }

  if (q.includes("relat") || q.includes("ticket")) {
    return "Em Relatórios você vê vendas no período, ticket médio e contas vencidas. Ajuste as datas e clique em Atualizar.";
  }

  return "Posso ajudar com vendas, estoque, fluxo de caixa, vendedores, relatórios e automações. Pergunte sobre um desses temas.";
}

/** Fase 2 — LLM opcional via feature flag + OPENAI_API_KEY. */
export async function responderMensagemAprendizComLlm(
  text: string,
  ctx: { ownerFirstName?: string; negocioNome?: string },
): Promise<{ reply: string; mode: "llm" | "templates" }> {
  const enabled = process.env.APRENDIZ_LLM_ENABLED === "true";
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!enabled || !apiKey) {
    return {
      reply: responderMensagemAprendiz(text, ctx),
      mode: "templates",
    };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.APRENDIZ_LLM_MODEL ?? "gpt-4o-mini",
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: `Você é o Aprendiz, assistente de um ERP simples em PT-BR. Negócio: ${ctx.negocioNome ?? "do cliente"}. Respostas curtas e práticas sobre vendas, estoque, fluxo de caixa e vendedores.`,
          },
          { role: "user", content: text },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (content) return { reply: content, mode: "llm" };
  } catch {
    /* fallback */
  }

  return {
    reply: responderMensagemAprendiz(text, ctx),
    mode: "templates",
  };
}

export type HelpdeskKbHit = {
  kbEntryId: string;
  title: string;
  snippet: string;
  score: number;
};

/** Respostas com contexto da base de conhecimento do Help Desk. */
export async function responderMensagemAprendizComHelpdesk(
  text: string,
  ctx: {
    kbHits?: HelpdeskKbHit[];
    ownerFirstName?: string;
    negocioNome?: string;
  },
): Promise<string> {
  const hits = ctx.kbHits ?? [];
  if (hits.length > 0) {
    const lines = hits
      .slice(0, 3)
      .map((h, i) => `${i + 1}. ${h.title}: ${h.snippet.replace(/<[^>]+>/g, "")}`);
    return `Encontrei na base de conhecimento:\n\n${lines.join("\n\n")}\n\nSe isso resolver, ótimo. Caso contrário, abra um ticket no Help Desk com os detalhes.`;
  }

  const q = text.trim().toLowerCase();
  if (
    /help|suporte|ti\b|computador|senha|email|rede|impressora|vpn|acesso|sistema/.test(
      q,
    )
  ) {
    return "Não encontrei um artigo correspondente na base ainda. Descreva o sintoma (o que você fez, mensagem de erro) e abra um ticket — a equipe de TI acompanha por lá.";
  }

  const llm = await responderMensagemAprendizComLlm(text, ctx);
  return llm.reply;
}
