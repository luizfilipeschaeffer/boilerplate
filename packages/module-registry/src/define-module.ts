import type { ModuleDefinition } from "@boilerplate/shared";

type DefineModuleInput = Omit<ModuleDefinition, "navItems" | "routes"> & {
  navLabel: string;
  navOrdem: number;
  routePath?: string;
};

export function defineModule(input: DefineModuleInput): ModuleDefinition {
  const path =
    input.routePath ?? `/${input.id.replace(/^core-|^fiscal-|^ops-/, "")}`;
  return {
    ...input,
    navItems: [
      {
        id: `${input.id}-nav`,
        label: input.navLabel,
        href: path,
        ordem: input.navOrdem,
      },
    ],
    routes: [{ path, label: input.navLabel }],
  };
}
