import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { MarketplaceShell } from "@/components/marketplace-shell";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Biblioteca — Boilerplate Marketplace",
  description:
    "Consulte módulos e integradores da plataforma Open Boilerplate Enterprise",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <MarketplaceShell>{children}</MarketplaceShell>
      </body>
    </html>
  );
}
