import type { BoilerplateModule } from "@boilerplate/sdk-core";
import { mergeCapabilities } from "@boilerplate/sdk-core";

export const moduleContract: BoilerplateModule = {
  id: "civil-obras",
  version: "0.1.0",
  coreContract: "^1.2.0",
  capabilities: mergeCapabilities({
    database: true,
    storage: true,
    queues: true,
    externalHttp: true,
  }),
  requiredPermissions: [
    "civil-obras.admin",
    "civil-obras.colaborador",
    "civil-obras.visualizador",
  ],
  routes: [
    { path: "/civil-obras", label: "Obras", permission: "civil-obras.visualizador" },
    { path: "/civil-obras/nova", label: "Nova obra", permission: "civil-obras.admin" },
    {
      path: "/civil-obras/[obraId]",
      label: "Visão geral da obra",
      permission: "civil-obras.visualizador",
    },
    {
      path: "/civil-obras/[obraId]/diario",
      label: "Diário de obra",
      permission: "civil-obras.visualizador",
    },
    {
      path: "/civil-obras/[obraId]/diario/nova",
      label: "Nova entrada",
      permission: "civil-obras.colaborador",
    },
    {
      path: "/civil-obras/[obraId]/calendario",
      label: "Calendário",
      permission: "civil-obras.visualizador",
    },
    {
      path: "/civil-obras/[obraId]/relatorio",
      label: "Relatórios",
      permission: "civil-obras.visualizador",
    },
    {
      path: "/civil-obras/[obraId]/usuarios",
      label: "Usuários",
      permission: "civil-obras.admin",
    },
    {
      path: "/civil-obras/[obraId]/busca",
      label: "Busca",
      permission: "civil-obras.visualizador",
    },
  ],
  eventHandlers: [
    {
      eventType: "civil-obras.entrada.publicada",
      eventVersion: "^1.0.0",
      handlerId: "civil-obras-on-entrada-publicada",
      async: true,
      moduleId: "civil-obras",
    },
    {
      eventType: "civil-obras.usuario.convidado",
      eventVersion: "^1.0.0",
      handlerId: "civil-obras-on-usuario-convidado",
      async: true,
      moduleId: "civil-obras",
    },
    {
      eventType: "civil-obras.relatorio.gerado",
      eventVersion: "^1.0.0",
      handlerId: "civil-obras-on-relatorio-gerado",
      async: true,
      moduleId: "civil-obras",
    },
  ],
};
