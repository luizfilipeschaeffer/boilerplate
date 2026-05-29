import type { ModuleServerContext } from "@boilerplate/sdk-server";
import { resolveIntegrator } from "@boilerplate/sdk-server";
import type { EntradaPublicadaPayload } from "@boilerplate/civil-obras";
import { createNotificacaoService } from "../services/notificacao.service";

const EMAIL_INTEGRATOR = "email-resend-mock";
const WHATSAPP_INTEGRATOR = "social-whatsapp-mock";

export async function handleEntradaPublicada(
  ctx: ModuleServerContext,
  organizationId: string,
  payload: EntradaPublicadaPayload,
  recipients: {
    email: string;
    nome: string;
    telefone: string | null;
    optInWhatsapp: boolean;
    id: string;
  }[],
): Promise<void> {
  const notif = createNotificacaoService(ctx);

  const emailed = new Set<string>();

  for (const mencionadoId of payload.mencaoUsuarioIds) {
    const mencionado = recipients.find((r) => r.id === mencionadoId);
    if (!mencionado) continue;
    if (!emailed.has(mencionado.email)) {
      emailed.add(mencionado.email);
      await notif.enqueueEmail({
        to: mencionado.email,
        subject: `[Obra] Você foi mencionado: ${payload.titulo}`,
        body: `Você foi mencionado em uma entrada.\n\n${payload.link}`,
        organizationId,
      });
    }
  }

  void resolveIntegrator;
  void recipients;
}
