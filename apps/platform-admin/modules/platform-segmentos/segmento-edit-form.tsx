"use client";

import type { MarketSegmentRow } from "@boilerplate/db";
import type { TipoNegocio } from "@boilerplate/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { saveSegmentAction } from "./actions";
import { TIPOS_NEGOCIO } from "@/lib/tipos-negocio";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SegmentoEditForm({
  segment,
  canEdit,
}: {
  segment: MarketSegmentRow;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(segment.name);
  const [slug] = useState(segment.slug);
  const [ordem, setOrdem] = useState(String(segment.ordem));
  const [ativo, setAtivo] = useState(segment.ativo);
  const [tipos, setTipos] = useState<Set<TipoNegocio>>(
    () => new Set(segment.tipoNegocioSugeridos as TipoNegocio[]),
  );

  useEffect(() => {
    setName(segment.name);
    setOrdem(String(segment.ordem));
    setAtivo(segment.ativo);
    setTipos(new Set(segment.tipoNegocioSugeridos as TipoNegocio[]));
    setSaved(false);
  }, [segment]);

  function toggleTipo(value: TipoNegocio) {
    if (!canEdit) return;
    setTipos((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    if (!canEdit) return;
    const ordemNum = Number(ordem);
    if (Number.isNaN(ordemNum)) {
      setError("Ordem deve ser um número.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await saveSegmentAction({
          slug,
          name: name.trim(),
          ordem: ordemNum,
          ativo,
          tipoNegocioSugeridos: [...tipos],
        });
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar segmento");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Segmento de negócio</CardTitle>
        <CardDescription>
          Dados gerais do segmento. O identificador (slug) não pode ser alterado
          após a criação.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : saved ? (
          <p className="text-sm text-muted-foreground">Segmento salvo.</p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="seg-name">Título</Label>
            <Input
              id="seg-name"
              value={name}
              disabled={!canEdit || pending}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seg-slug">Slug</Label>
            <Input
              id="seg-slug"
              value={slug}
              disabled
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seg-ordem">Ordem na lista</Label>
            <Input
              id="seg-ordem"
              type="number"
              value={ordem}
              disabled={!canEdit || pending}
              className="w-28"
              onChange={(e) => {
                setOrdem(e.target.value);
                setSaved(false);
              }}
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={ativo}
                disabled={!canEdit || pending}
                onCheckedChange={(c) => {
                  setAtivo(c === true);
                  setSaved(false);
                }}
              />
              Segmento ativo no onboarding
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tipos de negócio sugeridos</Label>
          <p className="text-xs text-muted-foreground">
            Nenhum selecionado = todos os tipos veem este segmento no cadastro.
          </p>
          <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-3">
            {TIPOS_NEGOCIO.map((t) => {
              const checked = tipos.has(t.value);
              return (
                <label
                  key={t.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                    canEdit && "hover:bg-muted/60",
                    !canEdit && "cursor-default opacity-80",
                    checked && "bg-muted/40",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    disabled={!canEdit || pending}
                    onCheckedChange={() => toggleTipo(t.value)}
                  />
                  <span>{t.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {canEdit ? (
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={pending}
              onClick={() => void handleSave()}
            >
              {pending ? "Salvando…" : "Salvar segmento"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
