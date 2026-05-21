import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { canAccessPlatformModule, type PlatformModuleId } from "@/lib/rbac";
import type { PlatformRole } from "@/lib/platform-role";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const ROUTE_MODULE: Record<string, PlatformModuleId> = {
  "/dashboard": "dashboard",
  "/crm": "platform-crm",
  "/comms": "platform-comms",
  "/insights": "platform-insights",
  "/organizacoes": "organizacoes",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth");

  if (!session?.user?.platformRole && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session?.user?.platformRole && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (session?.user?.platformRole) {
    const moduleId = Object.entries(ROUTE_MODULE).find(([path]) =>
      pathname === path || pathname.startsWith(`${path}/`),
    )?.[1];

    if (
      moduleId &&
      !canAccessPlatformModule(
        session.user.platformRole as PlatformRole,
        moduleId,
      )
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
