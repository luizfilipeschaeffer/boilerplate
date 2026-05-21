import { registerModule } from "./registry";
import { defineModule } from "./define-module";

function scaffold(
  id: string,
  name: string,
  opts: Partial<Parameters<typeof defineModule>[0]> = {},
) {
  registerModule(
    defineModule({
      id,
      name,
      faseMinima: 1,
      dependencias: opts.dependencias ?? [],
      implementationStatus: opts.implementationStatus ?? "scaffold",
      navLabel: name,
      navOrdem: opts.navOrdem ?? 99,
      parentModuleId: opts.parentModuleId,
      fiscalCapability: opts.fiscalCapability,
      tiposNegocioElegiveis: opts.tiposNegocioElegiveis,
      routePath: opts.routePath,
      ...opts,
    }),
  );
}

export function registerAllModules(): void {
  scaffold("core-catalogo", "Catálogo", {
    navOrdem: 10,
    routePath: "/catalogo",
    implementationStatus: "implemented",
  });
  scaffold("core-clientes", "Clientes", {
    navOrdem: 20,
    routePath: "/clientes",
    implementationStatus: "implemented",
  });
  scaffold("core-crm", "CRM", {
    navOrdem: 25,
    routePath: "/crm",
    dependencias: ["core-clientes"],
    implementationStatus: "scaffold",
  });
  scaffold("core-vendas", "Vendas", {
    navOrdem: 30,
    routePath: "/vendas",
    implementationStatus: "implemented",
  });
  scaffold("core-estoque-basico", "Estoque", {
    navOrdem: 40,
    dependencias: ["core-catalogo"],
    routePath: "/estoque",
    implementationStatus: "implemented",
  });
  scaffold("core-ranking", "Ranking", {
    navOrdem: 50,
    dependencias: ["core-vendas"],
    routePath: "/ranking",
    implementationStatus: "implemented",
  });

  scaffold("fiscal-core", "Fiscal", {
    navOrdem: 60,
    routePath: "/fiscal-core",
    implementationStatus: "implemented",
  });

  const fiscal = (
    id: string,
    name: string,
    cap: NonNullable<Parameters<typeof defineModule>[0]["fiscalCapability"]>,
    ordem: number,
    tipos?: Parameters<typeof defineModule>[0]["tiposNegocioElegiveis"],
  ) =>
    scaffold(id, name, {
      parentModuleId: "fiscal-core",
      dependencias: ["fiscal-core"],
      fiscalCapability: cap,
      navOrdem: ordem,
      routePath: `/${id}`,
      tiposNegocioElegiveis: tipos,
    });

  fiscal("fiscal-nfce", "NFC-e", "nfce", 61, ["varejo"]);
  fiscal("fiscal-nfe", "NF-e", "nfe", 62, ["atacado", "fornecedor", "fabricante"]);
  fiscal("fiscal-cte", "CT-e", "cte", 63, ["transportadora"]);
  fiscal("fiscal-mdfe", "MDF-e", "mdfe", 64, ["transportadora"]);
  fiscal("fiscal-ciot", "CIOT", "ciot", 65, ["transportadora"]);
  fiscal("fiscal-sped", "SPED", "sped", 66);
  fiscal("fiscal-rural", "NF Rural", "rural", 67, ["produtor_rural"]);

  scaffold("fiscal-contabil", "Contábil", {
    parentModuleId: "fiscal-core",
    dependencias: ["fiscal-core", "fiscal-sped"],
    navOrdem: 68,
    routePath: "/fiscal-contabil",
    faseMinima: 2,
  });

  scaffold("aprendiz", "Aprendiz", {
    navOrdem: 70,
    routePath: "/aprendiz",
    implementationStatus: "implemented",
  });
}
