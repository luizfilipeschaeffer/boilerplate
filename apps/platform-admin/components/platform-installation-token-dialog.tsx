"use client";

import { useState, useTransition } from "react";
import { createInstallationTokenAction } from "@/app/actions/installations";
import { SetHeaderActions } from "@/components/header-actions-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OrgOption = { id: string; name: string };

type Props = {
  organizations: OrgOption[];
};

export function PlatformInstallationTokenDialog({ organizations }: Props) {
  const [open, setOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const [name, setName] = useState("Instalação principal");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedOrg = organizations.find((o) => o.id === organizationId);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setToken(null);
      setError(null);
    }
  }

  return (
    <>
      <SetHeaderActions>
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          Nova instalação
        </Button>
      </SetHeaderActions>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova instalação self-hosted</DialogTitle>
            <DialogDescription>
              Registra uma nova VPS para o cliente e gera o token de bootstrap. Válido por 24
              horas — copie e envie ao cliente antes de fechar esta janela.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="install-org">Organização do cliente</Label>
              <Select
                value={organizationId}
                onValueChange={(value) => {
                  if (value) setOrganizationId(value);
                }}
              >
                <SelectTrigger id="install-org" className="w-full">
                  <SelectValue placeholder="Selecione…">
                    {selectedOrg?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="install-name">Nome da instalação</Label>
              <Input
                id="install-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: ERP Matriz, Filial SP…"
              />
            </div>
            {token ? (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
                <p className="mb-2 font-medium">Token gerado (copie agora)</p>
                <code className="block break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                  {token}
                </code>
                <p className="text-muted-foreground mt-2 text-xs">
                  Cole este valor no wizard da VPS em{" "}
                  <strong>Configuração inicial → Plataforma central</strong>.
                </p>
              </div>
            ) : null}
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Fechar
            </Button>
            <Button
              disabled={pending || !organizationId}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  setToken(null);
                  const result = await createInstallationTokenAction({
                    organizationId,
                    name,
                  });
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setToken(result.installationToken);
                })
              }
            >
              Gerar token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
