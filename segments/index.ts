import type { BoilerplateSegment } from "@boilerplate/sdk-core";

export const clinicaSegment: BoilerplateSegment = {
  id: "clinica",
  version: "1.0.0",
  name: "Clínica multiunidade",
  requiredModules: ["core-crm", "core-agenda", "fiscal-core"],
  recommendedIntegrators: ["payment-asaas", "messaging-resend"],
  hierarchyConfig: {
    defaultBranches: 2,
    departmentsPerBranch: 4,
    teamsPerDepartment: 3,
    enableFranchiseMode: false,
  },
};

export const ecommerceSegment: BoilerplateSegment = {
  id: "ecommerce",
  version: "1.0.0",
  name: "E-commerce",
  requiredModules: ["core-catalogo", "core-vendas", "core-estoque"],
  recommendedIntegrators: ["payment-stripe", "payment-mercadopago"],
};

export const juridicoSegment: BoilerplateSegment = {
  id: "juridico",
  version: "1.0.0",
  name: "Escritório jurídico",
  requiredModules: ["core-crm", "core-documentos"],
  recommendedIntegrators: ["messaging-resend"],
  hierarchyConfig: { teamsPerDepartment: 2 },
};

export const officialSegments = [clinicaSegment, ecommerceSegment, juridicoSegment];
