import { describe, expect, test } from "bun:test";
import { PACOTES_POR_FASE } from "@boilerplate/module-registry";

/** Testes de regra pura (fallback) sem DB. */
describe("PACOTES_POR_FASE fallback", () => {
  test("P1 inclui core-catalogo", () => {
    expect(PACOTES_POR_FASE[1]).toContain("core-catalogo");
  });

  test("P2 inclui fin-fluxo-caixa", () => {
    expect(PACOTES_POR_FASE[2]).toContain("fin-fluxo-caixa");
  });
});

describe("computeProvisioningStatus", () => {
  test("fase gratuita vai para trial", async () => {
    const { computeProvisioningStatus } = await import("./activation");
    const status = computeProvisioningStatus(
      {
        moduleIds: ["core-catalogo"],
        bundlePrecoId: null,
        requiresPaymentValidation: false,
        trialDays: 14,
        preActivateModules: true,
        fallbackUsed: false,
        demandaModuleIds: [],
      },
      false,
    );
    expect(status).toBe("trial");
  });

  test("fase paga sem verificação fica pre_active ou pending", async () => {
    const { computeProvisioningStatus } = await import("./activation");
    const pre = computeProvisioningStatus(
      {
        moduleIds: ["core-catalogo"],
        bundlePrecoId: null,
        requiresPaymentValidation: true,
        trialDays: 14,
        preActivateModules: true,
        fallbackUsed: false,
        demandaModuleIds: [],
      },
      false,
    );
    expect(pre).toBe("pre_active");

    const pending = computeProvisioningStatus(
      {
        moduleIds: ["core-catalogo"],
        bundlePrecoId: null,
        requiresPaymentValidation: true,
        trialDays: 14,
        preActivateModules: false,
        fallbackUsed: false,
        demandaModuleIds: [],
      },
      false,
    );
    expect(pending).toBe("pending_payment");
  });
});
