import { createEventHandler } from "@boilerplate/sdk-events";
import type { OrgBootContext } from "@boilerplate/sdk-core";
import { createModuleContext } from "@boilerplate/sdk-server";
import type {
  EntradaPublicadaPayload,
  RelatorioGeradoPayload,
  UsuarioConvidadoPayload,
} from "@boilerplate/civil-obras";
import { moduleContract } from "../contract";
import { handleEntradaPublicada } from "./on-entrada-publicada";
import { handleRelatorioGerado } from "./on-relatorio-gerado";
import { handleUsuarioConvidado } from "./on-usuario-convidado";

export type CivilObrasHandlerDeps = {
  orgContext: OrgBootContext;
  onSendEmail?: (input: {
    to: string;
    subject: string;
    body: string;
    organizationId: string;
  }) => Promise<void>;
  onEntradaPublicada?: (
    organizationId: string,
    payload: EntradaPublicadaPayload,
  ) => Promise<
    {
      email: string;
      nome: string;
      telefone: string | null;
      optInWhatsapp: boolean;
      id: string;
    }[]
  >;
};

export function registerCivilObrasHandlers(deps: CivilObrasHandlerDeps): () => void {
  const ctx = createModuleContext({
    moduleId: "civil-obras",
    capabilities: moduleContract.capabilities,
    orgContext: deps.orgContext,
  });

  const unsubs: (() => void)[] = [];

  unsubs.push(
    createEventHandler(
      {
        handlerId: "civil-obras-on-entrada-publicada",
        eventType: "civil-obras.entrada.publicada",
        eventVersion: "^1.0.0",
        async: true,
        moduleId: "civil-obras",
      },
      async (event) => {
        const payload = event.payload as EntradaPublicadaPayload;
        if (deps.onEntradaPublicada) {
          const recipients = await deps.onEntradaPublicada(
            event.organizationId,
            payload,
          );
          await handleEntradaPublicada(
            ctx,
            event.organizationId,
            payload,
            recipients,
          );
          return;
        }
        await handleEntradaPublicada(ctx, event.organizationId, payload, []);
      },
    ),
  );

  unsubs.push(
    createEventHandler(
      {
        handlerId: "civil-obras-on-usuario-convidado",
        eventType: "civil-obras.usuario.convidado",
        eventVersion: "^1.0.0",
        async: true,
        moduleId: "civil-obras",
      },
      async (event) => {
        await handleUsuarioConvidado(
          ctx,
          event.organizationId,
          event.payload as UsuarioConvidadoPayload,
          deps.onSendEmail,
        );
      },
    ),
  );

  unsubs.push(
    createEventHandler(
      {
        handlerId: "civil-obras-on-relatorio-gerado",
        eventType: "civil-obras.relatorio.gerado",
        eventVersion: "^1.0.0",
        async: true,
        moduleId: "civil-obras",
      },
      async (event) => {
        await handleRelatorioGerado(
          ctx,
          event.organizationId,
          event.payload as RelatorioGeradoPayload,
        );
      },
    ),
  );

  return () => {
    for (const u of unsubs) u();
  };
}
