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
import {
  savePlatformIntegratorCredentialsAction,
  testPlatformIntegratorConnectionAction,
} from "./credential-actions";

const SOURCE_LABELS: Record<CredentialStatus["source"], string> = {
  platform: "Plataforma",
  tenant: "Tenant",
  mock: "Mock",
  none: "Não configurado",
};

export function IntegratorCredentialsForm({
  integratorId,
  label,
  fields,
  initialStatus,
  canEdit,
}: {
  integratorId: string;
  label: string;
  fields: IntegratorConfigField[];
  initialStatus: CredentialStatus;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [healthMessage, setHealthMessage] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      if (field.type !== "secret") {
        const pub = initialStatus.configPublic[field.key];
        if (typeof pub === "string") initial[field.key] = pub;
      }
    }
    return initial;
  });

  function setField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    if (!canEdit) return;
    setError(null);
    setHealthMessage(null);
    startTransition(async () => {
      try {
        const next = await savePlatformIntegratorCredentialsAction({
          integratorId,
          values,
        });
        setStatus(next);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar");
      }
    });
  }

  function testConnection() {
    if (!canEdit) return;
    setHealthMessage(null);
    startTransition(async () => {
      try {
        const result = await testPlatformIntegratorConnectionAction(integratorId);
        setHealthMessage(result.message);
      } catch (e) {
        setHealthMessage(e instanceof Error ? e.message : "Falha no teste");
      }
    });
  }

  if (fields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{label}</CardTitle>
          <CardDescription className="font-mono text-xs">{integratorId}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este integrador ainda não possui schema de credenciais no catálogo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{label}</CardTitle>
          <Badge variant={status.configured ? "default" : "secondary"}>
            {SOURCE_LABELS[status.source]}
          </Badge>
        </div>
        <CardDescription className="font-mono text-xs">{integratorId}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {Object.keys(status.maskedSecrets).length > 0 ? (
          <div className="rounded-md border bg-muted/40 p-3">
            {Object.entries(status.maskedSecrets).map(([key, value]) => (
              <p key={key} className="font-mono text-xs text-muted-foreground">
                {key}: {value}
              </p>
            ))}
          </div>
        ) : null}

        {fields.map((field) => {
          const isSecret = field.type === "secret";
          const masked = status.maskedSecrets[field.key];
          const placeholder =
            isSecret && status.configured
              ? "Deixe em branco para manter"
              : field.required
                ? "Obrigatório"
                : "Opcional";

          return (
            <CredentialField
              key={field.key}
              field={field}
              configured={status.configured}
              value={values[field.key] ?? ""}
              masked={masked}
              placeholder={placeholder}
              onChange={(v) => setField(field.key, v)}
              disabled={!canEdit || pending}
            />
          );
        })}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {healthMessage ? (
          <p className="text-sm text-muted-foreground">{healthMessage}</p>
        ) : null}

        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button disabled={pending} onClick={save}>
              Salvar credenciais
            </Button>
            <Button variant="outline" disabled={pending} onClick={testConnection}>
              Testar conexão
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Somente administradores da plataforma podem editar credenciais.
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
  placeholder,
  onChange,
  disabled,
}: {
  field: IntegratorConfigField;
  configured: boolean;
  value: string;
  masked?: string;
  placeholder: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const isSecret = field.type === "secret";
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required ? " *" : ""}
      </Label>
      {isSecret && configured && masked ? (
        <p className="text-xs text-muted-foreground">Atual: {masked}</p>
      ) : null}
      <Input
        id={field.key}
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
