"use client";

import type { CredentialStatus, IntegratorConfigField } from "@boilerplate/db";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
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
import type { TenantIntegratorRow } from "@/app/actions/integrator-credentials";
import {
  restoreTenantIntegratorDefaultAction,
  saveTenantIntegratorCredentialsAction,
  testTenantIntegratorConnectionAction,
} from "@/app/actions/integrator-credentials";

function sourceBadge(source: CredentialStatus["source"]) {
  if (source === "tenant") {
    return <Badge>Credenciais próprias</Badge>;
  }
  if (source === "platform") {
    return <Badge variant="secondary">Usando plataforma</Badge>;
  }
  if (source === "mock") {
    return <Badge variant="outline">Mock</Badge>;
  }
  return <Badge variant="outline">Não configurado</Badge>;
}

export function TenantIntegratorsView({
  integrators,
  canEdit,
}: {
  integrators: TenantIntegratorRow[];
  canEdit: boolean;
}) {
  if (integrators.length === 0) {
    return (
      <p className="px-4 text-sm text-muted-foreground lg:px-6">
        Nenhum integrador com credenciais configuráveis está disponível para sua
        organização.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 lg:px-6">
      <p className="text-sm text-muted-foreground">
        Conecte credenciais próprias (BYOK) ou use os defaults da plataforma.
        Override ativo substitui as credenciais da plataforma para sua
        organização.
      </p>
      {integrators.map((item) => (
        <TenantIntegratorCard
          key={item.integratorId}
          item={item}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}

function TenantIntegratorCard({
  item,
  canEdit,
}: {
  item: TenantIntegratorRow;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(item.status);
  const [error, setError] = useState<string | null>(null);
  const [healthMessage, setHealthMessage] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of item.fields) {
      if (field.type !== "secret") {
        const pub = item.status.configPublic[field.key];
        if (typeof pub === "string") initial[field.key] = pub;
      }
    }
    return initial;
  });

  function save() {
    if (!canEdit) return;
    setError(null);
    startTransition(async () => {
      try {
        const next = await saveTenantIntegratorCredentialsAction({
          integratorId: item.integratorId,
          values,
        });
        setStatus(next);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar");
      }
    });
  }

  function restoreDefault() {
    if (!canEdit) return;
    setError(null);
    startTransition(async () => {
      try {
        const next = await restoreTenantIntegratorDefaultAction(item.integratorId);
        setStatus(next);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao restaurar");
      }
    });
  }

  function testConnection() {
    if (!canEdit) return;
    setHealthMessage(null);
    startTransition(async () => {
      try {
        const result = await testTenantIntegratorConnectionAction(item.integratorId);
        setHealthMessage(result.message);
      } catch (e) {
        setHealthMessage(e instanceof Error ? e.message : "Falha no teste");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">{item.label}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {item.integratorId}
            </CardDescription>
          </div>
          {sourceBadge(status.source)}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {Object.entries(status.maskedSecrets).map(([key, value]) => (
          <p key={key} className="font-mono text-xs text-muted-foreground">
            {key}: {value}
          </p>
        ))}

        {item.fields.map((field) => (
          <CredentialField
            key={field.key}
            field={field}
            configured={status.source === "tenant" || status.configured}
            value={values[field.key] ?? ""}
            masked={status.maskedSecrets[field.key]}
            disabled={!canEdit || pending}
            onChange={(v) =>
              setValues((prev) => ({ ...prev, [field.key]: v }))
            }
          />
        ))}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {healthMessage ? (
          <p className="text-sm text-muted-foreground">{healthMessage}</p>
        ) : null}

        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button disabled={pending} onClick={save}>
              Salvar credenciais próprias
            </Button>
            {status.source === "tenant" ? (
              <Button variant="outline" disabled={pending} onClick={restoreDefault}>
                Restaurar padrão da plataforma
              </Button>
            ) : null}
            <Button variant="secondary" disabled={pending} onClick={testConnection}>
              Testar conexão
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Somente o dono da organização pode alterar credenciais.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CredentialField({
  field,
  configured,
  value,
  masked,
  disabled,
  onChange,
}: {
  field: IntegratorConfigField;
  configured: boolean;
  value: string;
  masked?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const isSecret = field.type === "secret";
  const placeholder =
    isSecret && configured
      ? "Deixe em branco para manter"
      : field.required
        ? "Obrigatório"
        : "Opcional";

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`${field.key}-tenant`}>
        {field.label}
        {field.required ? " *" : ""}
      </Label>
      {isSecret && masked ? (
        <p className="text-xs text-muted-foreground">Atual: {masked}</p>
      ) : null}
      <Input
        id={`${field.key}-tenant`}
        type={isSecret ? "password" : "text"}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
