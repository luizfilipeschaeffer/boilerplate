import { describe, expect, test } from "bun:test";
import { createCanFn, resolveMostSpecificGrant } from "./permissions";
import type { MembershipRoleGrant } from "../contracts/permissions";

describe("resolveMostSpecificGrant", () => {
  const grants: MembershipRoleGrant[] = [
    {
      membershipId: "m1",
      role: "dono",
      organizationId: "org1",
      permissions: ["billing.read", "billing.write"],
    },
    {
      membershipId: "m1",
      role: "viewer",
      organizationId: "org1",
      branchId: "branch_123",
      permissions: ["billing.read"],
    },
  ];

  test("branch-specific grant wins over org-level", () => {
    const g = resolveMostSpecificGrant(grants, {
      organizationId: "org1",
      branchId: "branch_123",
    });
    expect(g?.role).toBe("viewer");
    expect(g?.permissions).toEqual(["billing.read"]);
  });
});

describe("createCanFn", () => {
  test("checks permission from grant", () => {
    const can = createCanFn(
      [
        {
          membershipId: "m1",
          role: "viewer",
          organizationId: "org1",
          branchId: "b1",
          permissions: ["billing.read"],
        },
      ],
      new Set(),
    );
    expect(can("billing.read", { organizationId: "org1", branchId: "b1" })).toBe(true);
    expect(can("billing.write", { organizationId: "org1", branchId: "b1" })).toBe(false);
  });
});
