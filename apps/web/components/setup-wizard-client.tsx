"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import type { DatabaseHealth, SetupStatus } from "@boilerplate/db/self-hosted";
import {
  runDatabaseCheckAction,
  linkPlatformAction,
  completeAccountStepAction,
  finalizeSetupAction,
} from "@/app/actions/setup-wizard";
import { SetupStepHint } from "@/components/setup-step-hint";
import { SetupCentralLogin } from "@/components/setup-central-login";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  { id: "database", title: "Banco de dados" },
  { id: "platform", title: "Plataforma central" },
  { id: "account", title: "Conta SSO" },
  { id: "license", title: "Licença e módulos" },
] as const;

type Props = {
  initialStatus: SetupStatus;
  defaultCentralUrl: string;
  detectedPublicUrl: string;
  useCentralAuth?: boolean;
};

export function SetupWizardClient({
  initialStatus,
  defaultCentralUrl,
  detectedPublicUrl,
  useCentralAuth = false,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [dbHealth, setDbHealth] = useState<DatabaseHealth | null>(
    initialStatus.database,
  );
  const [centralUrl, setCentralUrl] = useState(defaultCentralUrl);
  const [installToken, setInstallToken] = useState("");
  const [publicUrl, setPublicUrl] = useState(detectedPublicUrl);
  const [allowedOrigins, setAllowedOrigins] = useState(() => {
    try {
      return detectedPublicUrl ? [new URL(detectedPublicUrl).host] : [""];
    } catch {
      return [""];
    }
  });
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);
  const [pending, startTransition] = useTransition();

  const stepIndex = STEPS.findIndex((s) => s.id === status.step);
  const centralInstalacoesUrl = `${centralUrl.replace(/\/$/, "")}/instalacoes`;

  function nextStep(step: SetupStatus["step"]) {
    setMessage(null);
    setMessageIsError(false);
    setStatus((prev) => ({ ...prev, step }));
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuração inicial</h1>
        <p className="text-muted-foreground text-sm">
          Assistente pós-instalação da VPS — detectamos o ambiente, vinculamos sua
          assinatura e liberamos os módulos da licença.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <Badge key={s.id} variant={i <= stepIndex ? "default" : "outline"}>
            {i + 1}. {s.title}
          </Badge>
        ))}
      </div>

      {status.step === "database" && (
        <Card>
          <CardHeader>
            <CardTitle>Banco de dados</CardTitle>
            <CardDescription>
              Detectamos automaticamente a conexão PostgreSQL configurada em{" "}
              <code>DATABASE_URL</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SetupStepHint title="O que fazer nesta etapa">
              <ol>
                <li>Confirme que o PostgreSQL está rodando (Docker Compose ou serviço na VPS).</li>
                <li>
                  Verifique se <code>DATABASE_URL</code> no <code>.env</code> aponta para
                  o banco correto.
                </li>
                <li>
                  Clique em <strong>Testar e continuar</strong> — o assistente valida a
                  conexão e conta os schemas tenant existentes.
                </li>
              </ol>
            </SetupStepHint>
            {dbHealth?.ok ? (
              <ul className="text-sm text-muted-foreground">
                <li>PostgreSQL: {dbHealth.version?.slice(0, 40)}…</li>
                <li>Schemas tenant: {dbHealth.tenantSchemaCount}</li>
              </ul>
            ) : (
              <p className="text-destructive text-sm">{dbHealth?.error ?? "Aguardando teste…"}</p>
            )}
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const h = await runDatabaseCheckAction();
                  setDbHealth(h);
                  if (h.ok) nextStep("platform");
                  else {
                    setMessage(h.error ?? "Falha ao conectar no banco.");
                    setMessageIsError(true);
                  }
                })
              }
            >
              Testar e continuar
            </Button>
          </CardContent>
        </Card>
      )}

      {status.step === "platform" && (
        <Card>
          <CardHeader>
            <CardTitle>Vincular à plataforma central</CardTitle>
            <CardDescription>
              Conecte esta VPS à plataforma Boilerplate usando um token de instalação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SetupStepHint title="Como obter o token de instalação">
              <p>
                O token começa com <code>inst_</code>, expira em <strong>24 horas</strong> e
                só pode ser usado uma vez.
              </p>
              <p className="font-medium text-foreground">Opção A — equipe interna / suporte</p>
              <ol>
                <li>
                  Acesse a{" "}
                  <a href={centralInstalacoesUrl} target="_blank" rel="noreferrer">
                    plataforma central → Instalações
                  </a>
                  .
                </li>
                <li>Faça login como staff da Boilerplate.</li>
                <li>
                  Em <strong>Gerar token de instalação</strong>, selecione a organização do
                  cliente e clique em <strong>Gerar token</strong>.
                </li>
                <li>Copie o token e cole no campo abaixo.</li>
              </ol>
              <p className="font-medium text-foreground">Opção B — cadastro de novo cliente</p>
              <p>
                Ao criar a conta via{" "}
                <code>POST {centralUrl.replace(/\/$/, "")}/api/v1/public/signup</code>, a
                resposta JSON inclui <code>installationToken</code>.
              </p>
            </SetupStepHint>

            <div className="space-y-2">
              <Label htmlFor="central-url">URL da plataforma central</Label>
              <Input
                id="central-url"
                placeholder="https://admin.boilerplate.com.br"
                value={centralUrl}
                onChange={(e) => setCentralUrl(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Endereço do platform-admin (control plane). Em dev local, geralmente{" "}
                <code>http://localhost:3002</code>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="install-token">Token de instalação</Label>
              <Input
                id="install-token"
                placeholder="inst_…"
                value={installToken}
                onChange={(e) => setInstallToken(e.target.value)}
                autoComplete="off"
              />
              <p className="text-muted-foreground text-xs">
                Gerado em{" "}
                <a href={centralInstalacoesUrl} target="_blank" rel="noreferrer">
                  Instalações
                </a>{" "}
                na plataforma central.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="public-url">URL pública desta VPS</Label>
              <Input
                id="public-url"
                placeholder="https://erp.suaempresa.com.br"
                value={publicUrl}
                onChange={(e) => setPublicUrl(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Endereço que os usuários usarão para acessar o ERP. Detectamos{" "}
                <code>{detectedPublicUrl}</code> automaticamente — ajuste se usar domínio
                ou IP diferente na rede.
              </p>
            </div>

            <Button
              disabled={pending || !installToken.trim()}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await linkPlatformAction({
                      centralApiUrl: centralUrl,
                      installationToken: installToken,
                      publicUrl,
                    });
                    nextStep("account");
                  } catch (e) {
                    setMessage(e instanceof Error ? e.message : "Erro ao registrar");
                    setMessageIsError(true);
                  }
                })
              }
            >
              Registrar instalação
            </Button>
          </CardContent>
        </Card>
      )}

      {status.step === "account" && (
        <Card>
          <CardHeader>
            <CardTitle>Autenticação SSO</CardTitle>
            <CardDescription>
              Vincule o administrador local à mesma conta da plataforma central.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SetupStepHint title="O que fazer nesta etapa">
              <ol>
                <li>
                  Informe o <strong>e-mail e a senha da conta cliente</strong> vinculada à
                  organização desta instalação (não use a conta staff do painel interno).
                </li>
                <li>
                  Se ainda não tem conta, crie via cadastro na plataforma central (
                  <code>POST /api/v1/public/signup</code>) ou peça ao suporte.
                </li>
                <li>
                  Após entrar, avance para sincronizar licença e módulos na etapa seguinte.
                </li>
              </ol>
            </SetupStepHint>
            {useCentralAuth ? (
              <SetupCentralLogin callbackUrl="/setup?step=license" />
            ) : (
              <Button
                variant="outline"
                onClick={() =>
                  signIn("credentials", { callbackUrl: "/setup?step=license" })
                }
              >
                Entrar com conta Boilerplate
              </Button>
            )}
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await completeAccountStepAction();
                  if (!r.ok) {
                    setMessage(r.error);
                    setMessageIsError(true);
                    return;
                  }
                  nextStep("license");
                })
              }
            >
              Já estou autenticado — continuar
            </Button>
          </CardContent>
        </Card>
      )}

      {status.step === "license" && (
        <Card>
          <CardHeader>
            <CardTitle>Licença, domínios e módulos</CardTitle>
            <CardDescription>
              Sincronizamos sua licença, configuramos domínios permitidos e instalamos
              os módulos incluídos no plano.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SetupStepHint title="O que fazer nesta etapa">
              <ol>
                <li>
                  Informe os <strong>domínios ou hosts</strong> autorizados a acessar
                  esta instalação (ex.: <code>erp.suaempresa.com.br</code>).
                </li>
                <li>
                  Em desenvolvimento, inclua <code>localhost</code> ou o IP da LAN (ex.:{" "}
                  <code>192.168.x.x:3000</code>).
                </li>
                <li>
                  Ao concluir, baixamos a licença da plataforma central e instalamos os
                  módulos incluídos no plano automaticamente.
                </li>
              </ol>
              <p>
                Domínios também podem ser alterados depois em{" "}
                <strong>Configurações → Domínios</strong>.
              </p>
            </SetupStepHint>
            <div>
              <Label className="mb-2 block">Domínios de origem permitidos</Label>
              {allowedOrigins.map((o, i) => (
                <Input
                  key={i}
                  className="mb-2"
                  placeholder="erp.suaempresa.com.br"
                  value={o}
                  onChange={(e) => {
                    const next = [...allowedOrigins];
                    next[i] = e.target.value;
                    setAllowedOrigins(next);
                  }}
                />
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAllowedOrigins([...allowedOrigins, ""])}
              >
                + Adicionar domínio
              </Button>
            </div>
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await finalizeSetupAction({
                    publicUrl,
                    allowedOrigins: allowedOrigins.filter(Boolean),
                  });
                  if (!r.ok) {
                    setMessage(r.error);
                    setMessageIsError(true);
                    return;
                  }
                  window.location.href = "/dashboard";
                })
              }
            >
              Concluir e instalar módulos licenciados
            </Button>
          </CardContent>
        </Card>
      )}

      {message && (
        <p className={messageIsError ? "text-destructive text-sm" : "text-muted-foreground text-sm"}>
          {message}
        </p>
      )}
    </div>
  );
}
