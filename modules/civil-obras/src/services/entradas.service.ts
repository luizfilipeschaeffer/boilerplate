import type { ModuleServerContext } from "@boilerplate/sdk-server";

export function createEntradasService(ctx: ModuleServerContext) {
  void ctx;
  return {
    parseMencoes(texto: string, usuarioIds: { id: string; nome: string }[]) {
      const ids: string[] = [];
      for (const u of usuarioIds) {
        if (texto.includes(`@${u.nome}`) || texto.includes(`@${u.id}`)) {
          ids.push(u.id);
        }
      }
      return ids;
    },
  };
}
