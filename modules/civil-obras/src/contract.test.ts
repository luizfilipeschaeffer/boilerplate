import { describe, expect, test } from "bun:test";
import { moduleContract } from "./contract";

describe("civil-obras contract", () => {
  test("has required id and forbidden capabilities false", () => {
    expect(moduleContract.id).toBe("civil-obras");
    expect(moduleContract.capabilities.filesystem).toBe(false);
    expect(moduleContract.capabilities.processEnv).toBe(false);
    expect(moduleContract.capabilities.crossTenant).toBe(false);
  });

  test("declares storage queues and database", () => {
    expect(moduleContract.capabilities.database).toBe(true);
    expect(moduleContract.capabilities.storage).toBe(true);
    expect(moduleContract.capabilities.queues).toBe(true);
    expect(moduleContract.capabilities.externalHttp).toBe(true);
  });

  test("all routes have permission", () => {
    for (const route of moduleContract.routes) {
      expect(route.permission).toBeTruthy();
    }
  });

  test("registers three async event handlers", () => {
    expect(moduleContract.eventHandlers?.length).toBe(3);
    expect(moduleContract.eventHandlers?.every((h) => h.async)).toBe(true);
  });
});
