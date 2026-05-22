"use client";

import * as React from "react";
import {
  getMemberDetailAction,
  resendMemberInviteAction,
  saveMemberAccessAction,
} from "@/app/actions/members";
import {
  resolveMemberAccountStatus,
  type MemberAccountStatus,
} from "@boilerplate/db";
import {
  MEMBER_ACCOUNT_STATUS_LABELS,
  MemberAccountStatusBadge,
} from "@/lib/member-account-status";
import {
  ASSIGNABLE_ROLES,
  roleLabel,
} from "@/lib/role-labels";
import {
  grantedPermissionsForRole,
  PERMISSION_LABELS,
  permissionsForModule,
  roleHasModulePermission,
  type ModulePermissionKey,
} from "@/lib/module-permissions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ChevronRight } from "lucide-react";

type MemberDetail = NonNullable<
  Awaited<ReturnType<typeof getMemberDetailAction>>
>;

type SectorDraft = MemberDetail["sectors"][number];

function MemberConvidadoStatusHover({
  accountActive,
  resending,
  message,
  onResend,
}: {
  accountActive: boolean;
  resending: boolean;
  message: string | null;
  onResend: () => void;
}) {
  return (
    <HoverCard openDelay={200} closeDelay={80}>
      <HoverCardTrigger
        className="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        render={
          <button type="button" className="inline-flex cursor-pointer">
            <MemberAccountStatusBadge status="convidado" />
          </button>
        }
      />
      <HoverCardContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-52 p-2.5"
      >
        <div className="flex flex-col gap-2">
          <p className="text-xs leading-snug text-muted-foreground">
            Ainda sem senha. Reenvie o convite por e-mail.
          </p>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-7 w-full text-xs"
            disabled={resending || !accountActive}
            onClick={onResend}
          >
            {resending ? "Enviando…" : "Reenviar convite"}
          </Button>
          {!accountActive ? (
            <p className="text-xs text-muted-foreground">
              Reative a conta para reenviar o convite.
            </p>
          ) : null}
          {message ? (
            <p className="text-xs text-muted-foreground">{message}</p>
          ) : null}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function MemberAccessDialog({
  membershipId,
  open,
  onOpenChange,
  onSaved,
}: {
  membershipId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void | Promise<void>;
}) {
  const [detail, setDetail] = React.useState<MemberDetail | null>(null);
  const [draft, setDraft] = React.useState<{
    role: string;
    active: boolean;
    sectors: SectorDraft[];
  } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [resendingInvite, setResendingInvite] = React.useState(false);
  const [inviteMessage, setInviteMessage] = React.useState<string | null>(null);
  const [openSectors, setOpenSectors] = React.useState<Record<string, boolean>>(
    {},
  );

  const loadDetail = React.useCallback(async (id: string) => {
    setLoading(true);
    try {
      const d = await getMemberDetailAction(id);
      if (d) {
        setDetail(d);
        const sectors = d.sectors.map((s) => ({
          ...s,
          modules: s.modules.map((m) => ({ ...m })),
        }));
        setDraft({ role: d.role, active: d.active, sectors });
        setInviteMessage(null);
        setOpenSectors(
          Object.fromEntries(sectors.map((s) => [s.sectorId, s.assigned])),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!open || !membershipId) {
      setDetail(null);
      setDraft(null);
      setOpenSectors({});
      return;
    }
    void loadDetail(membershipId);
  }, [open, membershipId, loadDetail]);

  function updateSectorAssigned(sectorId: string, assigned: boolean) {
    if (!draft) return;
    setDraft({
      ...draft,
      sectors: draft.sectors.map((s) =>
        s.sectorId === sectorId ? { ...s, assigned } : s,
      ),
    });
    setOpenSectors((prev) => ({ ...prev, [sectorId]: assigned }));
  }

  function updateModuleEnabled(
    sectorId: string,
    moduleId: string,
    enabled: boolean,
  ) {
    if (!draft) return;
    const role = draft.role;
    setDraft({
      ...draft,
      sectors: draft.sectors.map((s) => {
        if (s.sectorId !== sectorId) return s;
        return {
          ...s,
          modules: s.modules.map((m) => {
            if (m.moduleId !== moduleId) return m;
            return {
              ...m,
              enabled,
              permissions: enabled
                ? grantedPermissionsForRole(role, moduleId)
                : [],
            };
          }),
        };
      }),
    });
  }

  function effectivePermissions(
    role: string,
    mod: SectorDraft["modules"][number],
  ): ModulePermissionKey[] {
    if (mod.permissions.length > 0) {
      return mod.permissions as ModulePermissionKey[];
    }
    return grantedPermissionsForRole(role, mod.moduleId);
  }

  function togglePermission(
    sectorId: string,
    moduleId: string,
    perm: ModulePermissionKey,
  ) {
    if (!draft) return;
    setDraft({
      ...draft,
      sectors: draft.sectors.map((s) => {
        if (s.sectorId !== sectorId) return s;
        return {
          ...s,
          modules: s.modules.map((m) => {
            if (m.moduleId !== moduleId || !m.enabled) return m;
            const current = effectivePermissions(draft.role, m);
            const has = current.includes(perm);
            const next = has
              ? current.filter((p) => p !== perm)
              : [...current, perm];
            return { ...m, permissions: next };
          }),
        };
      }),
    });
  }

  function applyRoleToPermissions(role: string) {
    if (!draft) return;
    setDraft({
      role,
      active: draft.active,
      sectors: draft.sectors.map((s) => ({
        ...s,
        modules: s.modules.map((m) => ({
          ...m,
          permissions: m.enabled
            ? grantedPermissionsForRole(role, m.moduleId)
            : m.permissions,
        })),
      })),
    });
  }

  async function handleSave() {
    if (!membershipId || !draft) return;
    setSaving(true);
    try {
      await saveMemberAccessAction(membershipId, {
        role: draft.role as MemberDetail["role"],
        active: draft.active,
        sectorIds: draft.sectors.filter((s) => s.assigned).map((s) => s.sectorId),
        sectors: draft.sectors
          .filter((s) => s.assigned)
          .map((s) => ({
            sectorId: s.sectorId,
            modules: s.modules.map((m) => ({
              moduleId: m.moduleId,
              enabled: m.enabled,
              permissions: m.permissions,
            })),
          })),
      });
      await onSaved?.();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  const assignedSectorCount =
    draft?.sectors.filter((s) => s.assigned).length ?? 0;

  const displayStatus: MemberAccountStatus | null =
    draft && detail
      ? resolveMemberAccountStatus({
          membershipActive: draft.active,
          hasPassword: detail.hasPassword,
        })
      : null;

  async function handleResendInvite() {
    if (!membershipId) return;
    setResendingInvite(true);
    setInviteMessage(null);
    try {
      const result = await resendMemberInviteAction(membershipId);
      setInviteMessage(result.message);
    } catch (err) {
      setInviteMessage(
        err instanceof Error ? err.message : "Não foi possível reenviar o convite.",
      );
    } finally {
      setResendingInvite(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,800px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>
            {detail ? `Acesso — ${detail.name}` : "Acesso do membro"}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <span>{detail?.email ?? "Setores, módulos e permissões."}</span>
            {displayStatus &&
            displayStatus === "convidado" &&
            detail &&
            detail.role !== "dono" &&
            draft ? (
              <MemberConvidadoStatusHover
                accountActive={draft.active}
                resending={resendingInvite}
                message={inviteMessage}
                onResend={() => void handleResendInvite()}
              />
            ) : displayStatus ? (
              <MemberAccountStatusBadge status={displayStatus} />
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loading || !draft || !detail ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end gap-3 border-b pb-4">
                <div className="grid gap-2 sm:w-[200px]">
                  <Label>Status da conta</Label>
                  {detail.role === "dono" ? (
                    <div className="flex h-9 items-center">
                      <MemberAccountStatusBadge status={displayStatus!} />
                    </div>
                  ) : (
                    <Select
                      value={displayStatus!}
                      onValueChange={(value) => {
                        if (value === "inativa") {
                          setDraft({ ...draft, active: false });
                        } else if (value === "ativa") {
                          setDraft({ ...draft, active: true });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {detail.hasPassword ? (
                          <>
                            <SelectItem value="ativa">
                              {MEMBER_ACCOUNT_STATUS_LABELS.ativa}
                            </SelectItem>
                            <SelectItem value="inativa">
                              {MEMBER_ACCOUNT_STATUS_LABELS.inativa}
                            </SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="convidado">
                              {MEMBER_ACCOUNT_STATUS_LABELS.convidado}
                            </SelectItem>
                            <SelectItem value="inativa">
                              {MEMBER_ACCOUNT_STATUS_LABELS.inativa}
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="grid gap-2 sm:w-[200px]">
                  <Label>Papel global</Label>
                  <Select
                    value={draft.role}
                    onValueChange={applyRoleToPermissions}
                    disabled={detail.role === "dono"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {detail.role === "dono" ? (
                        <SelectItem value="dono">Dono</SelectItem>
                      ) : (
                        ASSIGNABLE_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {roleLabel(r)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <span className="self-end pb-2 text-sm text-muted-foreground">
                  {assignedSectorCount} setor(es) com acesso
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {draft.sectors.map((sector) => (
                  <Collapsible
                    key={sector.sectorId}
                    open={openSectors[sector.sectorId] ?? false}
                    onOpenChange={(isOpen) =>
                      setOpenSectors((prev) => ({
                        ...prev,
                        [sector.sectorId]: isOpen,
                      }))
                    }
                    className="group/collapsible rounded-lg border"
                  >
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Checkbox
                        checked={sector.assigned}
                        disabled={detail.role === "dono"}
                        onCheckedChange={(v) =>
                          updateSectorAssigned(sector.sectorId, Boolean(v))
                        }
                      />
                      <CollapsibleTrigger
                        className="flex flex-1 items-center gap-2 text-left text-sm font-medium"
                        disabled={!sector.assigned}
                      >
                        <ChevronRight className="size-4 shrink-0 transition-transform group-data-[open]/collapsible:rotate-90" />
                        <span>{sector.sectorName}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {sector.sectorSlug}
                        </span>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="border-t px-3 pb-3">
                      {!sector.assigned ? (
                        <p className="py-2 text-xs text-muted-foreground">
                          Marque o setor para configurar módulos.
                        </p>
                      ) : sector.modules.length === 0 ? (
                        <p className="py-2 text-xs text-muted-foreground">
                          Nenhum módulo neste setor. Configure em Setores.
                        </p>
                      ) : (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {sector.modules.map((mod) => {
                            const name =
                              detail.moduleNames[mod.moduleId] ?? mod.moduleId;
                            const permKeys = permissionsForModule(mod.moduleId);
                            return (
                              <div
                                key={mod.moduleId}
                                className={`rounded-md border p-3 text-sm ${
                                  mod.enabled
                                    ? "border-primary/30 bg-primary/5"
                                    : "opacity-60"
                                }`}
                              >
                                <label className="flex items-center gap-2 font-medium">
                                  <Checkbox
                                    checked={mod.enabled}
                                    disabled={detail.role === "dono"}
                                    onCheckedChange={(v) =>
                                      updateModuleEnabled(
                                        sector.sectorId,
                                        mod.moduleId,
                                        Boolean(v),
                                      )
                                    }
                                  />
                                  {name}
                                </label>
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {mod.moduleId}
                                </p>
                                {mod.enabled ? (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {permKeys.map((perm) => {
                                      const roleAllows = roleHasModulePermission(
                                        draft.role,
                                        mod.moduleId,
                                        perm,
                                      );
                                      const checked = effectivePermissions(
                                        draft.role,
                                        mod,
                                      ).includes(perm);
                                      return (
                                        <label
                                          key={perm}
                                          className={`inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${
                                            checked
                                              ? "border-primary bg-primary/10"
                                              : "border-border"
                                          } ${!roleAllows ? "opacity-40" : ""}`}
                                        >
                                          <Checkbox
                                            className="size-3"
                                            checked={checked}
                                            disabled={
                                              detail.role === "dono" ||
                                              !roleAllows
                                            }
                                            onCheckedChange={() =>
                                              togglePermission(
                                                sector.sectorId,
                                                mod.moduleId,
                                                perm,
                                              )
                                            }
                                          />
                                          {PERMISSION_LABELS[perm]}
                                        </label>
                                      );
                                    })}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
                    disabled={saving || loading || detail?.role === "dono"}
            onClick={() => void handleSave()}
          >
            {saving ? "Salvando…" : "Salvar acesso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
