import type { PlatformRole } from "@/lib/platform-role";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      platformRole: PlatformRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    platformRole?: PlatformRole;
  }
}
