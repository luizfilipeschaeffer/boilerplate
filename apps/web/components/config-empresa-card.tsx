"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  contractOrganizationModulesAction,
  getOrganizationSettingsAction,
  saveOrganizationProfileAction,
  selectOrganizationPlanAction,
} from "@/app/actions/organization-settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { TIPOS_NEGOCIO } from "@/lib/tipos-negocio";
import { formatCentavosBRL } from "@boilerplate/billing";
import { Building2, Layers, PackagePlus } from "lucide-react";

type Settings = Awaited<ReturnType<typeof getOrganizationSettingsAction>>;

const CRM_STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  trial: "Trial",
  active: "Ativo",
  expansion: "Expansão",
  churn_risk: "Risco de churn",
};

export function ConfigEmpresaCard() {
  const router = useRouter();
  const [data, setData] = React.useState<Settings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingPlan, setSavingPlan] = React.useState<string | null>(null);
  const [contracting, setContracting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [tipoNegocio, setTipoNegocio] = React.useState("varejo");
  const [segmento, setSegmento] = React.useState("");
  const [hasCnpj, setHasCnpj] = React.useState(false);
  const [cnpj, setCnpj] = React.useState("");
  const [fiscalReady, setFiscalReady] = React.useState(false);
  const [selectedModules, setSelectedModules] = React.useState<string[]>([]);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await getOrganizationSettingsAction();
      setData(settings);
      const org = settings.organization;
      setName(org.name);
      setTipoNegocio(org.tipoNegocio);
      setSegmento(org.segmentoAtuacao ?? "");
      setHasCnpj(org.hasCnpj);
      setCnpj(org.cnpj ?? "");
      setFiscalReady(org.fiscalReady);
      setSelectedModules([]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível carregar.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  async function handleSaveProfile() {
    if (!data?.canEdit) return;
    setSavingProfile(true);
    setError(null);
    setSuccess(null);
    try {
      await saveOrganizationProfileAction({
        name,
        tipoNegocio,
        segmentoAtuacao: segmento || null,
        hasCnpj,
        cnpj: hasCnpj ? cnpj : null,
        fiscalReady,
      });
      setSuccess("Dados da empresa atualizados.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSelectPlan(planoId: string) {
    if (!data?.canEdit) return;
    setSavingPlan(planoId);
    setError(null);
    setSuccess(null);
    try {
      await selectOrganizationPlanAction(planoId);
      setSuccess("Plano atualizado. Módulos inclusos foram ativados.");
      router.refresh();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar plano.");
    } finally {
      setSavingPlan(null);
    }
  }

  async function handleContractModules() {
    if (!data?.canEdit || selectedModules.length === 0) return;
    setContracting(true);
    setError(null);
    setSuccess(null);
    try {
      await contractOrganizationModulesAction(selectedModules);
      setSuccess(
        selectedModules.length === 1
          ? "Módulo contratado com sucesso."
          : "Módulos contratados com sucesso.",
      );
      router.refresh();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao contratar.");
    } finally {
      setContracting(false);
    }
  }

  function toggleModule(id: string, checked: boolean) {
    setSelectedModules((prev) =>
      checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((m) => m !== id),
    );
  }

  if (loading) {
    return (
      <Card className="mx-4 lg:mx-6">
        <CardContent className="flex justify-center py-16">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { organization, billing, planos, canEdit, availableToContract, activeModuleIds } =
    data;

  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle>Minha empresa</CardTitle>
            <CardDescription>
              Dados cadastrais, plano contratado e módulos ativos da organização.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-8">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-sm text-muted-foreground" role="status">
            {success}
          </p>
        ) : null}

        <section className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-medium">Dados da empresa</h3>
            <p className="text-xs text-muted-foreground">
              Informações padrão usadas em relatórios, fiscal e personalização.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="org-name">Razão social / nome</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="grid gap-2">
              <Label>Tipo de negócio</Label>
              <Select
                value={tipoNegocio}
                onValueChange={setTipoNegocio}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_NEGOCIO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org-segmento">Segmento de atuação</Label>
              <Input
                id="org-segmento"
                value={segmento}
                onChange={(e) => setSegmento(e.target.value)}
                placeholder="Ex.: Moda feminina"
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox
                id="org-cnpj"
                checked={hasCnpj}
                onCheckedChange={(v) => setHasCnpj(Boolean(v))}
                disabled={!canEdit}
              />
              <Label htmlFor="org-cnpj" className="font-normal">
                Possui CNPJ
              </Label>
            </div>
            {hasCnpj ? (
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="org-cnpj-num">CNPJ</Label>
                <Input
                  id="org-cnpj-num"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  disabled={!canEdit}
                />
              </div>
            ) : null}
            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox
                id="org-fiscal"
                checked={fiscalReady}
                onCheckedChange={(v) => setFiscalReady(Boolean(v))}
                disabled={!canEdit}
              />
              <Label htmlFor="org-fiscal" className="font-normal">
                Pronto para emitir documentos fiscais
              </Label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Fase {organization.phase}</Badge>
            <Badge variant="outline">
              {CRM_STAGE_LABELS[organization.crmStage] ?? organization.crmStage}
            </Badge>
            <Badge variant="outline">{activeModuleIds.length} módulos ativos</Badge>
          </div>
          {canEdit ? (
            <Button
              type="button"
              className="w-fit"
              disabled={savingProfile}
              onClick={() => void handleSaveProfile()}
            >
              {savingProfile ? "Salvando…" : "Salvar dados"}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Apenas dono ou gerente pode editar os dados da empresa.
            </p>
          )}
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <div className="flex items-start gap-2">
            <Layers className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-medium">Plano e mensalidade</h3>
              <p className="text-xs text-muted-foreground">
                Plano sugerido pela fase {organization.phase}. Estimativa:{" "}
                <span className="font-medium text-foreground">
                  {formatCentavosBRL(billing.totalCentavos)}/mês
                </span>
                {billing.planoNome ? ` · ${billing.planoNome}` : null}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {planos.map((plano) => {
              const isCurrent = billing.planoId === plano.id;
              return (
                <div
                  key={plano.id}
                  className={`flex flex-col gap-2 rounded-xl border p-4 ${
                    isCurrent ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{plano.nome}</span>
                    {isCurrent ? (
                      <Badge variant="secondary" className="text-xs">
                        Atual
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-lg font-semibold">
                    {formatCentavosBRL(plano.precoMensalCentavos)}
                    <span className="text-xs font-normal text-muted-foreground">
                      /mês
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fase {plano.faseMinima}–{plano.faseMaxima} ·{" "}
                    {plano.modulosInclusos.length} módulos inclusos
                  </p>
                  {canEdit && !isCurrent ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={savingPlan !== null}
                      onClick={() => void handleSelectPlan(plano.id)}
                    >
                      {savingPlan === plano.id ? "Aplicando…" : "Selecionar plano"}
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <div className="flex items-start gap-2">
            <PackagePlus className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-medium">Contratar novos módulos</h3>
              <p className="text-xs text-muted-foreground">
                Ative capacidades adicionais além do plano. Configure setores em{" "}
                <span className="text-foreground">Setores</span> após contratar.
              </p>
            </div>
          </div>

          {availableToContract.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todos os módulos disponíveis para seu perfil já estão ativos.
            </p>
          ) : (
            <>
              <ul className="grid gap-2 sm:grid-cols-2">
                {availableToContract.map((mod) => {
                  const inputId = `mod-contract-${mod.id}`;
                  const checked = selectedModules.includes(mod.id);
                  return (
                    <li
                      key={mod.id}
                      className="flex gap-2.5 rounded-xl border p-3"
                    >
                      {canEdit ? (
                        <Checkbox
                          id={inputId}
                          checked={checked}
                          onCheckedChange={(v) =>
                            toggleModule(mod.id, Boolean(v))
                          }
                        />
                      ) : null}
                      <label
                        htmlFor={inputId}
                        className={`min-w-0 flex-1 ${canEdit ? "cursor-pointer" : ""}`}
                      >
                        <span className="text-sm font-medium">{mod.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {mod.precoLabel}
                          {mod.implementationStatus === "scaffold"
                            ? " · em evolução"
                            : null}
                        </p>
                      </label>
                    </li>
                  );
                })}
              </ul>
              {canEdit ? (
                <Button
                  type="button"
                  className="w-fit"
                  disabled={contracting || selectedModules.length === 0}
                  onClick={() => void handleContractModules()}
                >
                  {contracting
                    ? "Contratando…"
                    : `Contratar selecionados (${selectedModules.length})`}
                </Button>
              ) : null}
            </>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
