import type { CoreSectorSlug, DeliveryMarco } from "@boilerplate/shared";
import { registerModule } from "./registry";
import { defineModule } from "./define-module";

type ModuleMeta = {
  sectorSlug: CoreSectorSlug;
  depthCurrent: number;
  depthTarget: number;
  depthTargetMarco?: DeliveryMarco;
  deliveryMarco?: DeliveryMarco;
  camada?: string;
};

function scaffold(
  id: string,
  name: string,
  opts: Partial<Parameters<typeof defineModule>[0]> & Partial<ModuleMeta> = {},
) {
  const {
    sectorSlug,
    depthCurrent,
    depthTarget,
    depthTargetMarco,
    deliveryMarco,
    camada,
    ...rest
  } = opts;

  registerModule(
    defineModule({
      id,
      name,
      faseMinima: 1,
      dependencias: rest.dependencias ?? [],
      implementationStatus: rest.implementationStatus ?? "scaffold",
      navLabel: name,
      navOrdem: rest.navOrdem ?? 99,
      parentModuleId: rest.parentModuleId,
      fiscalCapability: rest.fiscalCapability,
      tiposNegocioElegiveis: rest.tiposNegocioElegiveis,
      routePath: rest.routePath,
      sectorSlug,
      depthCurrent,
      depthTarget,
      depthTargetMarco,
      deliveryMarco,
      camada,
      ...rest,
    }),
  );
}

export function registerAllModules(): void {
  scaffold("core-catalogo", "Catálogo", {
    navOrdem: 10,
    routePath: "/catalogo",
    implementationStatus: "implemented",
    sectorSlug: "operacao",
    camada: "Operacional",
    depthCurrent: 2,
    depthTarget: 3,
    depthTargetMarco: "R2",
    deliveryMarco: "R1",
  });
  scaffold("core-clientes", "Clientes", {
    navOrdem: 20,
    routePath: "/clientes",
    implementationStatus: "implemented",
    sectorSlug: "comercial",
    camada: "Tática",
    depthCurrent: 2,
    depthTarget: 3,
    depthTargetMarco: "R2",
    deliveryMarco: "R1",
  });
  scaffold("core-crm", "CRM Comercial", {
    navOrdem: 25,
    routePath: "/crm",
    dependencias: ["core-clientes"],
    implementationStatus: "implemented",
    sectorSlug: "comercial",
    camada: "Tática",
    depthCurrent: 2,
    depthTarget: 3,
    depthTargetMarco: "R3",
    deliveryMarco: "R3",
  });
  scaffold("core-vendas", "Vendas", {
    navOrdem: 30,
    routePath: "/vendas",
    implementationStatus: "implemented",
    sectorSlug: "comercial",
    camada: "Tática",
    depthCurrent: 2,
    depthTarget: 4,
    depthTargetMarco: "R3",
    deliveryMarco: "R1",
  });

  scaffold("core-pedidos", "Pedidos", {
    navOrdem: 28,
    routePath: "/pedidos",
    dependencias: ["core-catalogo", "core-clientes"],
    faseMinima: 2,
    implementationStatus: "implemented",
    sectorSlug: "comercial",
    camada: "Tática",
    depthCurrent: 1,
    depthTarget: 3,
    depthTargetMarco: "R3",
    deliveryMarco: "R3",
  });

  scaffold("ops-multi-loja", "Multi-loja", {
    navOrdem: 5,
    routePath: "/configuracoes/filiais",
    faseMinima: 3,
    implementationStatus: "implemented",
    sectorSlug: "operacao",
    camada: "Operacional",
    depthCurrent: 1,
    depthTarget: 3,
    depthTargetMarco: "R4",
    deliveryMarco: "R3",
  });
  scaffold("core-estoque-basico", "Estoque", {
    navOrdem: 40,
    dependencias: ["core-catalogo"],
    routePath: "/estoque/produtos",
    implementationStatus: "implemented",
    sectorSlug: "operacao",
    camada: "Operacional",
    depthCurrent: 2,
    depthTarget: 3,
    depthTargetMarco: "R2",
    deliveryMarco: "R1",
  });
  scaffold("ops-compras", "Compras", {
    navOrdem: 45,
    dependencias: ["core-catalogo", "core-estoque-basico"],
    routePath: "/compras",
    faseMinima: 2,
    implementationStatus: "implemented",
    sectorSlug: "operacao",
    camada: "Operacional",
    depthCurrent: 1,
    depthTarget: 3,
    depthTargetMarco: "R3",
    deliveryMarco: "R3",
  });
  scaffold("core-ranking", "Ranking", {
    navOrdem: 50,
    dependencias: ["core-vendas"],
    routePath: "/ranking",
    implementationStatus: "implemented",
    sectorSlug: "comercial",
    camada: "Tática",
    depthCurrent: 2,
    depthTarget: 3,
    depthTargetMarco: "R2",
    deliveryMarco: "R1",
  });

  scaffold("fiscal-core", "Fiscal", {
    navOrdem: 60,
    routePath: "/fiscal-core",
    implementationStatus: "implemented",
    sectorSlug: "fiscal",
    camada: "Compliance",
    depthCurrent: 1,
    depthTarget: 3,
    depthTargetMarco: "R3",
    deliveryMarco: "R1",
  });

  const fiscal = (
    id: string,
    name: string,
    cap: NonNullable<Parameters<typeof defineModule>[0]["fiscalCapability"]>,
    ordem: number,
    tipos?: Parameters<typeof defineModule>[0]["tiposNegocioElegiveis"],
    sectorSlug: CoreSectorSlug = "fiscal",
  ) =>
    scaffold(id, name, {
      parentModuleId: "fiscal-core",
      dependencias: ["fiscal-core"],
      fiscalCapability: cap,
      navOrdem: ordem,
      routePath: `/${id}`,
      tiposNegocioElegiveis: tipos,
      sectorSlug,
      camada: "Compliance",
      depthCurrent: 0,
      depthTarget: 2,
      depthTargetMarco: "R3",
    });

  fiscal("fiscal-nfce", "NFC-e", "nfce", 61, ["varejo"]);
  fiscal("fiscal-nfe", "NF-e", "nfe", 62, ["atacado", "fornecedor", "fabricante"]);
  fiscal("fiscal-cte", "CT-e", "cte", 63, ["transportadora"]);
  fiscal("fiscal-mdfe", "MDF-e", "mdfe", 64, ["transportadora"]);
  fiscal("fiscal-ciot", "CIOT", "ciot", 65, ["transportadora"]);
  fiscal("fiscal-sped", "SPED", "sped", 66, undefined, "compliance");
  fiscal("fiscal-rural", "NF Rural", "rural", 67, ["produtor_rural"]);

  scaffold("fiscal-contabil", "Contábil", {
    parentModuleId: "fiscal-core",
    dependencias: ["fiscal-core", "fiscal-sped"],
    navOrdem: 68,
    routePath: "/fiscal-contabil",
    faseMinima: 2,
    sectorSlug: "fiscal",
    camada: "Compliance",
    depthCurrent: 0,
    depthTarget: 2,
    depthTargetMarco: "R4",
  });

  scaffold("fin-fluxo-caixa", "Fluxo de caixa", {
    navOrdem: 35,
    routePath: "/fluxo-caixa",
    faseMinima: 2,
    dependencias: ["core-vendas"],
    implementationStatus: "implemented",
    sectorSlug: "financeiro",
    camada: "Tática",
    depthCurrent: 2,
    depthTarget: 3,
    depthTargetMarco: "R2",
    deliveryMarco: "R2",
  });

  scaffold("ops-vendedores", "Vendedores", {
    navOrdem: 36,
    routePath: "/vendedores",
    faseMinima: 2,
    dependencias: ["core-vendas"],
    implementationStatus: "implemented",
    sectorSlug: "pessoas",
    camada: "Tática",
    depthCurrent: 3,
    depthTarget: 4,
    depthTargetMarco: "R3",
    deliveryMarco: "R2",
  });

  scaffold("rel-basico", "Relatórios", {
    navOrdem: 55,
    routePath: "/relatorios",
    faseMinima: 2,
    dependencias: ["core-vendas"],
    implementationStatus: "implemented",
    sectorSlug: "analytics",
    camada: "Estratégica",
    depthCurrent: 2,
    depthTarget: 4,
    depthTargetMarco: "R4",
    deliveryMarco: "R2",
  });

  scaffold("segment-moda", "Catálogo Moda", {
    navOrdem: 11,
    routePath: "/catalogo",
    faseMinima: 2,
    dependencias: ["core-catalogo"],
    implementationStatus: "implemented",
    tiposNegocioElegiveis: ["varejo"],
    sectorSlug: "operacao",
    camada: "Operacional",
    depthCurrent: 1,
    depthTarget: 3,
    depthTargetMarco: "R3",
    deliveryMarco: "R2",
  });

  scaffold("segment-alimentacao", "Catálogo Alimentação", {
    navOrdem: 12,
    routePath: "/catalogo",
    faseMinima: 2,
    dependencias: ["core-catalogo"],
    implementationStatus: "implemented",
    tiposNegocioElegiveis: ["varejo", "atacado"],
    sectorSlug: "operacao",
    camada: "Operacional",
    depthCurrent: 1,
    depthTarget: 3,
    depthTargetMarco: "R3",
    deliveryMarco: "R2",
  });

  scaffold("aprendiz", "Aprendiz", {
    navOrdem: 70,
    routePath: "/aprendiz",
    implementationStatus: "implemented",
    sectorSlug: "tecnologia",
    camada: "Técnica",
    depthCurrent: 2,
    depthTarget: 4,
    depthTargetMarco: "R3",
    deliveryMarco: "R1",
  });

  scaffold("crm-helpdesk", "Help Desk TI", {
    navOrdem: 86,
    routePath: "/helpdesk",
    faseMinima: 2,
    dependencias: ["aprendiz"],
    implementationStatus: "implemented",
    sectorSlug: "tecnologia",
    camada: "Tática",
    depthCurrent: 2,
    depthTarget: 3,
    depthTargetMarco: "R3",
    deliveryMarco: "R3",
  });
}
