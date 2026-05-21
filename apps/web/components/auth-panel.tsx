"use client";

import Link from "next/link";

import { LoginForm } from "@/components/login-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AuthPanel({
  className,
  initialEmail = "",
  inactivityLogout = false,
}: {
  className?: string;
  initialEmail?: string;
  inactivityLogout?: boolean;
}) {
  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <LoginForm
        initialEmail={initialEmail}
        inactivityLogout={inactivityLogout}
      />
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Primeira vez aqui?</p>
        <Link
          href="/cadastro"
          className={cn(
            buttonVariants({ variant: "link" }),
            "h-auto p-0 text-primary",
          )}
        >
          Conhecer o Aprendiz e criar conta
        </Link>
      </div>
    </div>
  );
}
