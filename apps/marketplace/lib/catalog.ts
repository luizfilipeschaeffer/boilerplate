import { readFileSync } from "node:fs";
import { join } from "node:path";
import { registerAllModules, getAllModules } from "@boilerplate/module-registry";
import {
  ensureEcosystemPublicationsSeeded,
  listEcosystemPublications,
} from "@boilerplate/db";
import type { TrustLevel } from "@boilerplate/sdk-core";
import type { LibraryCatalog, LibraryIntegrator, LibraryModule } from "./catalog-types";

export type { LibraryCatalog, LibraryIntegrator, LibraryModule, LibraryItem } from "./catalog-types";
export { formatPrice } from "./format-price";

type CatalogJson = {
  integrators: Array<{
    id: string;
    label: string;
    tipo: string;
    provider?: string;
    description?: string;
    implementationStatus: string;
    modulosSuportados?: string[];
    packagePath?: string;
    deliveryMarco?: string | null;
  }>;
  moduloPrecos?: Array<{ moduleId: string; precoMensalCentavos: number; ativo: boolean }>;
};

function catalogJsonPath(): string {
  return join(process.cwd(), "../../packages/db/data/platform-catalog.json");
}

function loadCatalogJson(): CatalogJson {
  const raw = readFileSync(catalogJsonPath(), "utf8");
  return JSON.parse(raw) as CatalogJson;
}

function trustFromStatus(status: string, official = true): TrustLevel {
  if (status === "implemented") return official ? "official" : "verified";
  if (status === "scaffold") return "verified";
  return "community";
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    implemented: "Implementado",
    scaffold: "Em desenvolvimento",
    planned: "Planejado",
  };
  return map[status] ?? status;
}

function tipoLabel(tipo: string): string {
  const map: Record<string, string> = {
    payment: "Pagamento",
    fiscal: "Fiscal",
    messaging: "Mensageria",
    social: "Social",
    webhook: "Webhook",
  };
  return map[tipo] ?? tipo;
}

export async function getLibraryCatalog(): Promise<LibraryCatalog> {
  registerAllModules();
  await ensureEcosystemPublicationsSeeded();
  const communityPublications = await listEcosystemPublications();
  const approvedCommunity = communityPublications.filter(
    (p) => p.moderationStatus === "approved" && p.availableToTenants,
  );
  const catalogJson = loadCatalogJson();
  const priceByModule = new Map(
    (catalogJson.moduloPrecos ?? [])
      .filter((p) => p.ativo)
      .map((p) => [p.moduleId, p.precoMensalCentavos]),
  );

  const modules: LibraryModule[] = getAllModules().map((m) => ({
    kind: "module",
    id: m.id,
    name: m.name,
    description: buildModuleDescription(m),
    trustLevel: trustFromStatus(m.implementationStatus),
    status: statusLabel(m.implementationStatus),
    sector: m.sectorSlug,
    camada: m.camada,
    faseMinima: m.faseMinima,
    dependencias: m.dependencias,
    route: m.routes[0]?.path,
    precoMensalCentavos: priceByModule.get(m.id) ?? null,
    namespace: "@boilerplate",
  }));

  for (const pub of approvedCommunity.filter((p) => p.kind === "module")) {
    modules.push({
      kind: "module",
      id: pub.externalId,
      name: pub.name,
      description: pub.description ?? "",
      trustLevel: (pub.trustLevel as TrustLevel) ?? "verified",
      status: "Implementado",
      sector: "ecommerce",
      camada: "Comunidade",
      faseMinima: 1,
      dependencias: [],
      route: `/${pub.externalId}`,
      precoMensalCentavos: null,
      namespace: "@boilerplate-community",
    });
  }

  const integrators: LibraryIntegrator[] = (catalogJson.integrators ?? []).map((i) => ({
    kind: "integrator",
    id: i.id,
    name: i.label,
    description: i.description ?? "",
    trustLevel: trustFromStatus(i.implementationStatus, !i.id.includes("mock")),
    status: statusLabel(i.implementationStatus),
    tipo: tipoLabel(i.tipo),
    provider: i.provider ?? "—",
    modulosSuportados: i.modulosSuportados ?? ["*"],
    packagePath: i.packagePath ?? null,
    deliveryMarco: i.deliveryMarco ?? null,
    namespace: i.id.startsWith("example") ? "@boilerplate-community" : "@boilerplate",
  }));

  for (const pub of approvedCommunity.filter((p) => p.kind === "integrator")) {
    integrators.push({
      kind: "integrator",
      id: pub.externalId,
      name: pub.name,
      description: pub.description ?? "",
      trustLevel: (pub.trustLevel as TrustLevel) ?? "verified",
      status: "Implementado",
      tipo: tipoLabel(pub.category ?? "messaging"),
      provider: pub.publisherName ?? "Comunidade",
      modulosSuportados: ["*"],
      packagePath: pub.packagePath ?? null,
      deliveryMarco: null,
      namespace: "@boilerplate-community",
    });
  }

  modules.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  integrators.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return {
    modules,
    integrators,
    stats: {
      moduleCount: modules.length,
      integratorCount: integrators.length,
      implementedModules: modules.filter((m) => m.status === "Implementado").length,
      implementedIntegrators: integrators.filter((i) => i.status === "Implementado").length,
    },
  };
}

function buildModuleDescription(m: {
  name: string;
  dependencias: string[];
  camada?: string;
  sectorSlug?: string;
}): string {
  const parts: string[] = [`Módulo ${m.name.toLowerCase()} da plataforma.`];
  if (m.camada) parts.push(`Camada: ${m.camada}.`);
  if (m.sectorSlug) parts.push(`Setor: ${m.sectorSlug}.`);
  if (m.dependencias.length > 0) {
    parts.push(`Depende de: ${m.dependencias.join(", ")}.`);
  }
  return parts.join(" ");
}
