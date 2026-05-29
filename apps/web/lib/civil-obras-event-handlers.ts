import "server-only";

import { registerCivilObrasHandlers } from "@boilerplate/civil-obras-module";
import type { EntradaPublicadaPayload } from "@boilerplate/civil-obras";
import { listUsuariosObraForNotificacao } from "@boilerplate/db";
import {
  sendCivilObrasEmail,
  sendCivilObrasWhatsapp,
} from "@/lib/civil-obras-notify";

let registered = false;

export function registerCivilObrasEventHandlers(): void {
  if (registered) return;
  registered = true;

  registerCivilObrasHandlers({
    orgContext: {
      organizationId: "platform",
      schemaName: "public",
      branchId: null,
      departmentId: null,
    },
    onSendEmail: sendCivilObrasEmail,
    onEntradaPublicada: async (organizationId, payload) => {
      const p = payload as EntradaPublicadaPayload & { schemaName?: string };
      const schemaName = p.schemaName ?? "tenant_default";
      const recipients = await listUsuariosObraForNotificacao(
        schemaName,
        organizationId,
        payload.obraId,
      );
      for (const user of recipients) {
        await sendCivilObrasEmail({
          organizationId,
          to: user.email,
          subject: `[Obra] Nova entrada: ${payload.titulo}`,
          body: `Olá ${user.nome},\n\n${payload.trecho}\n\nVer: ${payload.link}`,
        });
        if (user.optInWhatsapp && user.telefone) {
          await sendCivilObrasWhatsapp({
            to: user.telefone,
            body: `Nova entrada: ${payload.titulo}. ${payload.link}`,
          });
        }
      }
      return recipients;
    },
  });
}
