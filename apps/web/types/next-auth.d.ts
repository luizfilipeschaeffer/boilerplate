import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
    };
    organizationId?: string;
    sectorId?: string;
    branchId?: string;
    role?: string;
    needsOnboarding?: boolean;
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    organizationId?: string;
    sectorId?: string;
    branchId?: string;
    role?: string;
    needsOnboarding?: boolean;
    sessionVersion?: number;
  }
}
