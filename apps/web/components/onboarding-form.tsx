"use client";

import * as React from "react";
import type { TipoNegocio } from "@boilerplate/shared";
import { submitOnboarding } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

const TIPOS: { value: TipoNegocio; label: string }[] = [
  { value: "pessoa_fisica", label: "Pessoa física / autônomo" },
  { value: "varejo", label: "Varejo" },
  { value: "atacado", label: "Atacado" },
  { value: "fornecedor", label: "Fornecedor" },
  { value: "distribuidor", label: "Distribuidor" },
  { value: "transportadora", label: "Transportadora" },
  { value: "fabricante", label: "Fabricante" },
  { value: "industria", label: "Indústria" },
  { value: "produtor_rural", label: "Produtor rural" },
];

export function OnboardingForm() {
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [orgName, setOrgName] = React.useState("");
  const [tipo, setTipo] = React.useState<TipoNegocio>("varejo");
  const [temPontoFixo, setTemPontoFixo] = React.useState(false);
  const [vendasMes, setVendasMes] = React.useState<
    "ate50" | "50a200" | "200a1000" | "acima1000"
  >("ate50");
  const [temFuncionarios, setTemFuncionarios] = React.useState(false);
  const [emiteNota, setEmiteNota] = React.useState<string>("nao");
  const [possuiCnpj, setPossuiCnpj] = React.useState(false);
  const [cnpj, setCnpj] = React.useState("");

  async function finish() {
    setSubmitting(true);
    try {
      await submitOnboarding({
        organizationName: orgName,
        tipoNegocio: tipo,
        temPontoFixo,
        vendasMes,
        temFuncionarios,
        emiteNota:
          emiteNota === "sim" ? true : emiteNota === "nao" ? false : null,
        possuiCnpj,
        cnpj: possuiCnpj ? cnpj : null,
      });
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Configurar sua empresa</h1>
        <p className="text-sm text-muted-foreground">
          Diagnóstico rápido — passo {step + 1} de 3
        </p>
      </div>

      <FieldGroup>
        {step === 0 && (
          <>
            <Field>
              <FieldLabel>Nome da empresa</FieldLabel>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Minha Loja Ltda"
                required
              />
            </Field>
            <Field>
              <FieldLabel>Tipo de negócio</FieldLabel>
              <Select
                value={tipo}
                onValueChange={(v) => setTipo(v as TipoNegocio)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field>
              <FieldLabel>Você tem ponto fixo (loja, escritório)?</FieldLabel>
              <Select
                value={temPontoFixo ? "sim" : "nao"}
                onValueChange={(v) => setTemPontoFixo(v === "sim")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Vendas por mês (aprox.)</FieldLabel>
              <Select
                value={vendasMes}
                onValueChange={(v) =>
                  setVendasMes(v as typeof vendasMes)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ate50">Até 50</SelectItem>
                  <SelectItem value="50a200">50 a 200</SelectItem>
                  <SelectItem value="200a1000">200 a 1.000</SelectItem>
                  <SelectItem value="acima1000">Acima de 1.000</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Tem funcionários?</FieldLabel>
              <Select
                value={temFuncionarios ? "sim" : "nao"}
                onValueChange={(v) => setTemFuncionarios(v === "sim")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field>
              <FieldLabel>Possui CNPJ?</FieldLabel>
              <Select
                value={possuiCnpj ? "sim" : "nao"}
                onValueChange={(v) => setPossuiCnpj(v === "sim")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {possuiCnpj ? (
              <Field>
                <FieldLabel>CNPJ</FieldLabel>
                <Input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                />
              </Field>
            ) : null}
            <Field>
              <FieldLabel>Já emite nota fiscal?</FieldLabel>
              <Select
                value={emiteNota}
                onValueChange={(v) => setEmiteNota(v ?? "nao")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="nao_sei">Ainda não / não sei</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </>
        )}

        <div className="flex gap-2 pt-2">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
            >
              Voltar
            </Button>
          ) : null}
          {step < 2 ? (
            <Button
              type="button"
              className="flex-1"
              disabled={step === 0 && orgName.trim().length < 2}
              onClick={() => setStep((s) => s + 1)}
            >
              Continuar
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1"
              disabled={submitting}
              onClick={() => void finish()}
            >
              {submitting ? (
                <>
                  <Spinner className="mr-2" />
                  Configurando…
                </>
              ) : (
                "Concluir e entrar"
              )}
            </Button>
          )}
        </div>
      </FieldGroup>
    </div>
  );
}
