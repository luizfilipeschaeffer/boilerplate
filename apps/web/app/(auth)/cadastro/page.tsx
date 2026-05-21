"use client";

import { useRouter } from "next/navigation";

import { AprendizCadastroChat } from "@/components/signup-chat";

export default function CadastroPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 md:p-10">
      <AprendizCadastroChat onBackToLogin={() => router.push("/login")} />
    </div>
  );
}
