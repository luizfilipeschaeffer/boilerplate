import { describe, expect, test } from "bun:test";
import { resolveSegmentSlugForProvisioning } from "./sector-provisioning";

describe("resolveSegmentSlugForProvisioning", () => {
  test("usa segmento com template", () => {
    expect(resolveSegmentSlugForProvisioning("varejo")).toBe("varejo");
    expect(resolveSegmentSlugForProvisioning("restaurante")).toBe("restaurante");
  });

  test("fallback para varejo quando segmento sem template", () => {
    expect(resolveSegmentSlugForProvisioning("segmento_inexistente_xyz")).toBe(
      "varejo",
    );
  });
});
