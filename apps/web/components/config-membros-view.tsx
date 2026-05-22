"use client";

import * as React from "react";
import { listMembersAction } from "@/app/actions/members";
import { SetHeaderInfo } from "@/components/header-actions-context";
import { MemberAccessDialog } from "@/components/member-access-dialog";
import { MembrosHeaderToolbar } from "@/components/membros-header-toolbar";
import {
  MembersDataTable,
  type MemberTableRow,
} from "@/components/members-data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function ConfigMembrosView() {
  const [members, setMembers] = React.useState<MemberTableRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [accessMemberId, setAccessMemberId] = React.useState<string | null>(
    null,
  );
  const [accessOpen, setAccessOpen] = React.useState(false);

  const reloadList = React.useCallback(async () => {
    const rows = await listMembersAction();
    setMembers(rows);
  }, []);

  React.useEffect(() => {
    void (async () => {
      try {
        await reloadList();
      } finally {
        setLoading(false);
      }
    })();
  }, [reloadList]);

  const hasConvidado = members.some((m) => m.accountStatus === "convidado");

  React.useEffect(() => {
    const onFocus = () => void reloadList();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [reloadList]);

  React.useEffect(() => {
    if (!hasConvidado) return;
    const id = window.setInterval(() => void reloadList(), 12_000);
    return () => window.clearInterval(id);
  }, [hasConvidado, reloadList]);

  function openAccess(membershipId: string) {
    setAccessMemberId(membershipId);
    setAccessOpen(true);
  }

  if (loading) return <Spinner className="m-8" />;

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <MembrosHeaderToolbar onMemberCreated={reloadList} />
      <SetHeaderInfo>
        Convide operadores, defina setores de acesso e permissões por módulo.
      </SetHeaderInfo>

      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
          <CardDescription>
            {members.length}{" "}
            {members.length === 1 ? "membro" : "membros"}. Clique em Acesso ou
            selecione uma linha para configurar setores e permissões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembersDataTable
            members={members}
            onConfigureAccess={openAccess}
          />
        </CardContent>
      </Card>

      <MemberAccessDialog
        membershipId={accessMemberId}
        open={accessOpen}
        onOpenChange={(open) => {
          setAccessOpen(open);
          if (!open) {
            setAccessMemberId(null);
            void reloadList();
          }
        }}
        onSaved={reloadList}
      />
    </div>
  );
}
