"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { listContextOptionsAction } from "@/app/actions/context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Layers } from "lucide-react";
import { updateSessionContext } from "@/lib/auth/update-session-context";

type ContextSwitchersProps = {
  branchId?: string | null;
  sectorId?: string;
};

export function ContextSwitchers({
  branchId: initialBranchId,
  sectorId: initialSectorId = "geral",
}: ContextSwitchersProps) {
  const router = useRouter();
  const [options, setOptions] = React.useState<
    Awaited<ReturnType<typeof listContextOptionsAction>> | null
  >(null);
  const [branchId, setBranchId] = React.useState(initialBranchId ?? "");
  const [sectorId, setSectorId] = React.useState(initialSectorId);

  React.useEffect(() => {
    setBranchId(initialBranchId ?? "");
    setSectorId(initialSectorId);
  }, [initialBranchId, initialSectorId]);

  React.useEffect(() => {
    void listContextOptionsAction().then(setOptions);
  }, []);

  if (
    !options ||
    (options.branches.length <= 1 && options.sectors.length <= 1)
  ) {
    return null;
  }

  const resolvedBranchId =
    branchId || options.branchId || options.branches[0]?.id || "";
  const sectorSlug = options.sectors.some((s) => s.slug === sectorId)
    ? sectorId
    : (options.sectors[0]?.slug ?? sectorId);

  return (
    <div className="flex flex-col gap-2 px-2 py-2 group-data-[collapsible=icon]:hidden">
      {options.branches.length > 1 ? (
        <div className="space-y-1">
          <span className="flex items-center gap-1 px-1 text-xs text-muted-foreground">
            <Building2 className="size-3" />
            Filial
          </span>
          <Select
            value={resolvedBranchId}
            onValueChange={async (id) => {
              setBranchId(id);
              await updateSessionContext({ branchId: id });
              router.refresh();
            }}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder="Filial" />
            </SelectTrigger>
            <SelectContent>
              {options.branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {options.sectors.length > 1 ? (
        <div className="space-y-1">
          <span className="flex items-center gap-1 px-1 text-xs text-muted-foreground">
            <Layers className="size-3" />
            Setor
          </span>
          <Select
            value={sectorSlug}
            onValueChange={async (slug) => {
              setSectorId(slug);
              await updateSessionContext({ sectorId: slug });
              router.refresh();
            }}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent>
              {options.sectors.map((s) => (
                <SelectItem key={s.id} value={s.slug}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
}
