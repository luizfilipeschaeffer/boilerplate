import type { TrustLevel } from "@boilerplate/sdk-core";

export type LibraryModule = {
  kind: "module";
  id: string;
  name: string;
  description: string;
  trustLevel: TrustLevel;
  status: string;
  sector?: string;
  camada?: string;
  faseMinima: number;
  dependencias: string[];
  route?: string;
  precoMensalCentavos: number | null;
  namespace: "@boilerplate" | "@boilerplate-community";
};

export type LibraryIntegrator = {
  kind: "integrator";
  id: string;
  name: string;
  description: string;
  trustLevel: TrustLevel;
  status: string;
  tipo: string;
  provider: string;
  modulosSuportados: string[];
  packagePath: string | null;
  deliveryMarco: string | null;
  namespace: "@boilerplate" | "@boilerplate-community";
};

export type LibraryCatalog = {
  modules: LibraryModule[];
  integrators: LibraryIntegrator[];
  stats: {
    moduleCount: number;
    integratorCount: number;
    implementedModules: number;
    implementedIntegrators: number;
  };
};

export type LibraryItem = LibraryModule | LibraryIntegrator;
