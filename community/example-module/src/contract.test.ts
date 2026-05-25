import { describe, expect, test } from "bun:test";
import { moduleContract } from "./contract";

describe("example-module contract", () => {
  test("has required fields", () => {
    expect(moduleContract.id).toBe("example-module");
    expect(moduleContract.capabilities.filesystem).toBe(false);
    expect(moduleContract.eventHandlers?.length).toBeGreaterThan(0);
  });
});
