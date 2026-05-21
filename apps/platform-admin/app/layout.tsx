import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boilerplate — Painel da Plataforma",
  description: "CRM, comunicação e insights (time interno)",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-svh bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
