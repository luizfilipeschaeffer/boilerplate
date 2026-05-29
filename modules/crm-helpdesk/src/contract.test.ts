import { describe, expect, test } from "bun:test";
import { moduleContract } from "./contract";

describe("crm-helpdesk contract", () => {
  test("has required fields", () => {
    expect(moduleContract.id).toBe("crm-helpdesk");
    expect(moduleContract.capabilities.filesystem).toBe(false);
    expect(moduleContract.eventHandlers?.length).toBeGreaterThan(0);
  });
});
