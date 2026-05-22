import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { canAccessRoute } from "@/lib/rbac";
import { NextResponse } from "next/server";

/** Edge: sem Prisma. Setup (onboarding vs painel) é resolvido no servidor via `resolveUserSetup`. */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/cadastro") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/esqueci-senha") ||
    pathname.startsWith("/convite-vendedor");
  const isPublic =
    isAuthPage ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/trpc");

  if (!session?.user && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (
    session?.user &&
    (pathname === "/login" || pathname.startsWith("/cadastro"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const role = (session as { role?: string })?.role ?? "dono";
  if (session?.user && !isPublic && pathname.startsWith("/")) {
    if (!canAccessRoute(role, pathname)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  // Não interceptar /api/auth — handlers ficam em app/api/auth/[...nextauth]
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
