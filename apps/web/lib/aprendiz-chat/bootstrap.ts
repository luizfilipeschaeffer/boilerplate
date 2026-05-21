export type AprendizChatBootstrapInput = {
  primeiroContato: boolean;
  ownerName: string;
  negocioNome: string;
  insights: string[];
  pendingPasswordSetup?: boolean;
  userEmail?: string;
};

export type BootstrapMessage = {
  role: "aprendiz" | "user";
  content: string;
  meta?: Record<string, unknown> | null;
};

export function buildAprendizChatBootstrap(
  input: AprendizChatBootstrapInput,
): BootstrapMessage[] {
  const firstName = input.ownerName.trim().split(/\s+/)[0] || "você";
  const messages: BootstrapMessage[] = [];

  if (input.primeiroContato) {
    messages.push({
      role: "aprendiz",
      content: `Olá, ${firstName}! Que bom te ver no painel — obrigado por me contar sobre o ${input.negocioNome} no cadastro. A partir de agora aprendo com cada venda, estoque e processo que você registrar.`,
    });
  } else {
    messages.push({
      role: "aprendiz",
      content: `Olá, ${firstName}! Sou o Aprendiz do ${input.negocioNome}. Estou aqui para automatizar rotinas e responder dúvidas do dia a dia.`,
    });
  }

  if (input.insights.length > 0) {
    messages.push({
      role: "aprendiz",
      content: `O que já sei sobre você:\n\n${input.insights.map((l) => `• ${l}`).join("\n")}`,
      meta: { kind: "insights" },
    });
  }

  messages.push({
    role: "aprendiz",
    content:
      "Estas são as automações que posso executar por você nesta fase. Ligue ou desligue quando quiser:",
    meta: { kind: "automations_panel" },
  });

  messages.push({
    role: "aprendiz",
    content:
      "Pode me perguntar sobre vendas, estoque, clientes ou catálogo — salvo nossa conversa para continuar de onde paramos.",
  });

  return messages;
}
