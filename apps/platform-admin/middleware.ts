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
  "/modulos": "platform-modulos",
  "/roadmap": "platform-roadmap",
  "/organizacoes": "organizacoes",
  "/segmentos": "platform-segmentos",
  "/integradores": "platform-integradores",
  "/comunidade": "platform-comunidade",
};

function isAllowedPlatformIp(req: Request): boolean {
  const allowed = process.env.PLATFORM_ADMIN_ALLOWED_IPS?.trim();
  if (!allowed) return true;
  const ips = allowed.split(",").map((v) => v.trim()).filter(Boolean);
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const candidate = forwarded ?? realIp ?? "";
  return ips.includes(candidate);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth");

  if (!isAllowedPlatformIp(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

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
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
