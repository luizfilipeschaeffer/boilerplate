"use client";

import * as React from "react";

import { LoginForm } from "@/components/login-form";
import { AprendizCadastroChat } from "@/components/signup-chat";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AuthMode = "login" | "signup";

export function AuthPanel({
  className,
  initialEmail = "",
}: {
  className?: string;
  initialEmail?: string;
}) {
  const [mode, setMode] = React.useState<AuthMode>("login");

  if (mode === "signup") {
    return (
      <AprendizCadastroChat
        className={className}
        onBackToLogin={() => setMode("login")}
      />
    );
  }

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <LoginForm initialEmail={initialEmail} />
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Primeira vez aqui?</p>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-primary"
          onClick={() => setMode("signup")}
        >
          Conhecer o Aprendiz e criar conta
        </Button>
      </div>
    </div>
  );
}
