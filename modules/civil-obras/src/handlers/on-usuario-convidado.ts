import type { ModuleServerContext } from "@boilerplate/sdk-server";
import type { UsuarioConvidadoPayload } from "@boilerplate/civil-obras";
import { createNotificacaoService } from "../services/notificacao.service";

export async function handleUsuarioConvidado(
  ctx: ModuleServerContext,
  organizationId: string,
  payload: UsuarioConvidadoPayload,
  sendEmail?: (input: {
    to: string;
    subject: string;
    body: string;
    organizationId: string;
  }) => Promise<void>,
): Promise<void> {
  const mail = {
    to: payload.email,
    subject: "Convite — Gestão de Obras",
    body: `Olá ${payload.nome},\n\nVocê foi convidado para acessar a obra.\n\nAcesse: ${payload.conviteLink}`,
    organizationId,
  };
  if (sendEmail) {
    await sendEmail(mail);
    return;
  }
  const notif = createNotificacaoService(ctx);
  await notif.enqueueEmail(mail);
}
