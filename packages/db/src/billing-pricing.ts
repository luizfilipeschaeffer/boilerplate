import { prisma } from "./client";

export interface ModuloPrecoRow {
  moduleId: string;
  precoMensalCentavos: number;
  faseMinima: number;
  cobrancaAvulsa: boolean;
  ativo: boolean;
}

export interface PlanoBaseRow {
  id: string;
  nome: string;
  precoMensalCentavos: number;
  faseMinima: number;
  faseMaxima: number;
  modulosInclusos: string[];
  ativo: boolean;
}

export interface BundlePrecoRow {
  id: string;
  nome: string;
  moduleIds: string[];
  precoMensalCentavos: number;
  ativo: boolean;
}

function parseStringArray(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is string => typeof x === "string");
}

export async function listModuloPrecos(): Promise<ModuloPrecoRow[]> {
  const rows = await prisma.moduloPreco.findMany({ orderBy: { moduleId: "asc" } });
  return rows.map((r) => ({
    moduleId: r.moduleId,
    precoMensalCentavos: r.precoMensalCentavos,
    faseMinima: r.faseMinima,
    cobrancaAvulsa: r.cobrancaAvulsa,
    ativo: r.ativo,
  }));
}

export async function upsertModuloPreco(input: ModuloPrecoRow): Promise<void> {
  await prisma.moduloPreco.upsert({
    where: { moduleId: input.moduleId },
    create: {
      moduleId: input.moduleId,
      precoMensalCentavos: input.precoMensalCentavos,
      faseMinima: input.faseMinima,
      cobrancaAvulsa: input.cobrancaAvulsa,
      ativo: input.ativo,
    },
    update: {
      precoMensalCentavos: input.precoMensalCentavos,
      faseMinima: input.faseMinima,
      cobrancaAvulsa: input.cobrancaAvulsa,
      ativo: input.ativo,
    },
  });
}

export async function listPlanosBase(): Promise<PlanoBaseRow[]> {
  const rows = await prisma.planoBase.findMany({ orderBy: { faseMinima: "asc" } });
  return rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    precoMensalCentavos: r.precoMensalCentavos,
    faseMinima: r.faseMinima,
    faseMaxima: r.faseMaxima,
    modulosInclusos: parseStringArray(r.modulosInclusos),
    ativo: r.ativo,
  }));
}

export async function upsertPlanoBase(input: PlanoBaseRow): Promise<void> {
  await prisma.planoBase.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      nome: input.nome,
      precoMensalCentavos: input.precoMensalCentavos,
      faseMinima: input.faseMinima,
      faseMaxima: input.faseMaxima,
      modulosInclusos: input.modulosInclusos,
      ativo: input.ativo,
    },
    update: {
      nome: input.nome,
      precoMensalCentavos: input.precoMensalCentavos,
      faseMinima: input.faseMinima,
      faseMaxima: input.faseMaxima,
      modulosInclusos: input.modulosInclusos,
      ativo: input.ativo,
    },
  });
}

export async function listBundlePrecos(): Promise<BundlePrecoRow[]> {
  const rows = await prisma.bundlePreco.findMany({ orderBy: { nome: "asc" } });
  return rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    moduleIds: parseStringArray(r.moduleIds),
    precoMensalCentavos: r.precoMensalCentavos,
    ativo: r.ativo,
  }));
}

export async function upsertBundlePreco(input: BundlePrecoRow): Promise<void> {
  await prisma.bundlePreco.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      nome: input.nome,
      moduleIds: input.moduleIds,
      precoMensalCentavos: input.precoMensalCentavos,
      ativo: input.ativo,
    },
    update: {
      nome: input.nome,
      moduleIds: input.moduleIds,
      precoMensalCentavos: input.precoMensalCentavos,
      ativo: input.ativo,
    },
  });
}

export async function getModuloAtivacaoCounts(): Promise<
  { moduloId: string; count: number }[]
> {
  const rows = await prisma.moduloAtivo.groupBy({
    by: ["moduloId"],
    _count: { moduloId: true },
    orderBy: { _count: { moduloId: "desc" } },
  });
  return rows.map((r) => ({
    moduloId: r.moduloId,
    count: r._count.moduloId,
  }));
}

const DEFAULT_MODULO_PRECOS: ModuloPrecoRow[] = [
  { moduleId: "core-catalogo", precoMensalCentavos: 0, faseMinima: 1, cobrancaAvulsa: false, ativo: true },
  { moduleId: "core-clientes", precoMensalCentavos: 0, faseMinima: 1, cobrancaAvulsa: false, ativo: true },
  { moduleId: "core-vendas", precoMensalCentavos: 0, faseMinima: 1, cobrancaAvulsa: false, ativo: true },
  { moduleId: "core-estoque-basico", precoMensalCentavos: 0, faseMinima: 1, cobrancaAvulsa: false, ativo: true },
  { moduleId: "core-ranking", precoMensalCentavos: 0, faseMinima: 1, cobrancaAvulsa: false, ativo: true },
  { moduleId: "core-crm", precoMensalCentavos: 2900, faseMinima: 2, cobrancaAvulsa: true, ativo: true },
  { moduleId: "fiscal-core", precoMensalCentavos: 0, faseMinima: 1, cobrancaAvulsa: false, ativo: true },
  { moduleId: "fiscal-nfce", precoMensalCentavos: 3500, faseMinima: 1, cobrancaAvulsa: true, ativo: true },
  { moduleId: "fiscal-nfe", precoMensalCentavos: 4000, faseMinima: 1, cobrancaAvulsa: true, ativo: true },
  { moduleId: "fiscal-cte", precoMensalCentavos: 4500, faseMinima: 1, cobrancaAvulsa: true, ativo: true },
  { moduleId: "fiscal-mdfe", precoMensalCentavos: 2500, faseMinima: 1, cobrancaAvulsa: true, ativo: true },
  { moduleId: "fiscal-ciot", precoMensalCentavos: 2000, faseMinima: 1, cobrancaAvulsa: true, ativo: true },
  { moduleId: "fiscal-sped", precoMensalCentavos: 3000, faseMinima: 1, cobrancaAvulsa: true, ativo: true },
  { moduleId: "fiscal-rural", precoMensalCentavos: 3500, faseMinima: 1, cobrancaAvulsa: true, ativo: true },
  { moduleId: "fiscal-contabil", precoMensalCentavos: 0, faseMinima: 2, cobrancaAvulsa: true, ativo: false },
  { moduleId: "aprendiz", precoMensalCentavos: 0, faseMinima: 1, cobrancaAvulsa: false, ativo: true },
  { moduleId: "fin-fluxo-caixa", precoMensalCentavos: 2900, faseMinima: 2, cobrancaAvulsa: true, ativo: true },
  { moduleId: "ops-vendedores", precoMensalCentavos: 1900, faseMinima: 2, cobrancaAvulsa: true, ativo: true },
  { moduleId: "rel-basico", precoMensalCentavos: 1900, faseMinima: 2, cobrancaAvulsa: true, ativo: true },
  { moduleId: "segment-moda", precoMensalCentavos: 0, faseMinima: 2, cobrancaAvulsa: false, ativo: true },
  { moduleId: "segment-alimentacao", precoMensalCentavos: 0, faseMinima: 2, cobrancaAvulsa: false, ativo: true },
];

const DEFAULT_PLANOS: PlanoBaseRow[] = [
  {
    id: "essencial",
    nome: "Essencial",
    precoMensalCentavos: 4900,
    faseMinima: 1,
    faseMaxima: 2,
    modulosInclusos: [
      "core-catalogo",
      "core-clientes",
      "core-vendas",
      "core-estoque-basico",
      "core-ranking",
    ],
    ativo: true,
  },
  {
    id: "profissional",
    nome: "Profissional",
    precoMensalCentavos: 12900,
    faseMinima: 3,
    faseMaxima: 3,
    modulosInclusos: [
      "core-catalogo",
      "core-clientes",
      "core-vendas",
      "core-estoque-basico",
      "core-ranking",
      "fiscal-nfce",
      "fiscal-sped",
    ],
    ativo: true,
  },
  {
    id: "escala",
    nome: "Escala",
    precoMensalCentavos: 29900,
    faseMinima: 4,
    faseMaxima: 4,
    modulosInclusos: [
      "core-catalogo",
      "core-clientes",
      "core-vendas",
      "core-estoque-basico",
      "core-ranking",
      "fiscal-nfce",
      "fiscal-sped",
    ],
    ativo: true,
  },
];

const DEFAULT_BUNDLES: BundlePrecoRow[] = [
  {
    id: "varejo-fiscal",
    nome: "Varejo Fiscal",
    moduleIds: ["fiscal-nfce", "fiscal-sped"],
    precoMensalCentavos: 5500,
    ativo: true,
  },
  {
    id: "transporte-fiscal",
    nome: "Transporte Fiscal",
    moduleIds: ["fiscal-cte", "fiscal-mdfe", "fiscal-ciot"],
    precoMensalCentavos: 8900,
    ativo: true,
  },
];

export async function seedDefaultPricingIfEmpty(): Promise<void> {
  const [modCount, planCount, bundleCount] = await Promise.all([
    prisma.moduloPreco.count(),
    prisma.planoBase.count(),
    prisma.bundlePreco.count(),
  ]);

  if (modCount === 0) {
    for (const row of DEFAULT_MODULO_PRECOS) {
      await upsertModuloPreco(row);
    }
  }
  if (planCount === 0) {
    for (const row of DEFAULT_PLANOS) {
      await upsertPlanoBase(row);
    }
  }
  if (bundleCount === 0) {
    for (const row of DEFAULT_BUNDLES) {
      await upsertBundlePreco(row);
    }
  }
}

export async function calcularMensalidadeFromDb(
  modulosAtivos: string[],
  fase: number,
): Promise<{
  totalCentavos: number;
  planoBaseCentavos: number;
  addonsCentavos: number;
  planoId: string | null;
}> {
  const [precos, planos, bundles] = await Promise.all([
    listModuloPrecos(),
    listPlanosBase(),
    listBundlePrecos(),
  ]);

  const plano =
    planos.find(
      (p) => p.ativo && fase >= p.faseMinima && fase <= p.faseMaxima,
    ) ?? null;

  const incluidos = new Set(plano?.modulosInclusos ?? []);
  const precoByModule = new Map(
    precos.filter((p) => p.ativo).map((p) => [p.moduleId, p]),
  );

  const activeBundles = bundles.filter((b) => b.ativo);
  const coveredByBundle = new Set<string>();
  let bundleDiscount = 0;

  for (const bundle of activeBundles) {
    const ids = bundle.moduleIds;
    if (ids.length > 0 && ids.every((id) => modulosAtivos.includes(id))) {
      for (const id of ids) coveredByBundle.add(id);
      const sumIndividual = ids.reduce(
        (s, id) => s + (precoByModule.get(id)?.precoMensalCentavos ?? 0),
        0,
      );
      if (sumIndividual > bundle.precoMensalCentavos) {
        bundleDiscount += sumIndividual - bundle.precoMensalCentavos;
      }
    }
  }

  let addonsCentavos = 0;
  for (const moduleId of modulosAtivos) {
    if (incluidos.has(moduleId) || coveredByBundle.has(moduleId)) continue;
    const preco = precoByModule.get(moduleId);
    if (preco?.cobrancaAvulsa && preco.precoMensalCentavos > 0) {
      addonsCentavos += preco.precoMensalCentavos;
    }
  }

  const planoBaseCentavos = plano?.precoMensalCentavos ?? 0;
  const totalCentavos = Math.max(
    0,
    planoBaseCentavos + addonsCentavos - bundleDiscount,
  );

  return {
    totalCentavos,
    planoBaseCentavos,
    addonsCentavos: addonsCentavos - bundleDiscount,
    planoId: plano?.id ?? null,
  };
}
