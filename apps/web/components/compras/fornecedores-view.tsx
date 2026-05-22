"use client";

import * as React from "react";
import { Pencil, Plus } from "lucide-react";

import {
  createSupplierAction,
  listCategoriesForSupplierFormAction,
  listSuppliersAction,
  updateSupplierAction,
  type SupplierDto,
} from "@/app/actions/suppliers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CategoryOption = {
  id: string;
  parentId: string | null;
  name: string;
  isSub: boolean;
};

export function FornecedoresView({
  initialSuppliers,
  canEdit,
}: {
  initialSuppliers: SupplierDto[];
  canEdit: boolean;
}) {
  const [suppliers, setSuppliers] = React.useState(initialSuppliers);
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SupplierDto | null>(null);
  const [pending, setPending] = React.useState(false);

  const [name, setName] = React.useState("");
  const [document, setDocument] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [leadTimeDays, setLeadTimeDays] = React.useState("0");
  const [notes, setNotes] = React.useState("");
  const [selectedCats, setSelectedCats] = React.useState<Set<string>>(new Set());
  const [defaultCat, setDefaultCat] = React.useState<string | null>(null);

  React.useEffect(() => {
    void listCategoriesForSupplierFormAction().then(setCategories);
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setDocument("");
    setEmail("");
    setPhone("");
    setLeadTimeDays("0");
    setNotes("");
    setSelectedCats(new Set());
    setDefaultCat(null);
    setOpen(true);
  }

  function openEdit(s: SupplierDto) {
    setEditing(s);
    setName(s.name);
    setDocument(s.document ?? "");
    setEmail(s.email ?? "");
    setPhone(s.phone ?? "");
    setLeadTimeDays(String(s.leadTimeDays));
    setNotes(s.notes ?? "");
    setSelectedCats(new Set(s.categoryIds));
    setDefaultCat(s.defaultCategoryId);
    setOpen(true);
  }

  function toggleCat(id: string) {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (defaultCat === id) setDefaultCat(null);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const payload = {
        name: name.trim(),
        document: document.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        leadTimeDays: parseInt(leadTimeDays, 10) || 0,
        notes: notes.trim() || null,
        categoryIds: [...selectedCats],
        defaultCategoryId: defaultCat,
      };
      if (editing) {
        await updateSupplierAction(editing.id, payload);
      } else {
        await createSupplierAction(payload);
      }
      setSuppliers(await listSuppliersAction());
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      {canEdit ? (
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Novo fornecedor
          </Button>
        </div>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          {suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Cadastre fornecedores e vincule às categorias que abastecem.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Prazo (dias)</TableHead>
                  <TableHead>Categorias</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.leadTimeDays}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.categoryIds.length}
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={(e) => void handleSubmit(e)}>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar fornecedor" : "Novo fornecedor"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>CNPJ/CPF</Label>
                  <Input
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Prazo (dias)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>E-mail</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="mb-2 block">Categorias abastecidas</Label>
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Crie categorias no catálogo primeiro.
                  </p>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                    {categories.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedCats.has(c.id)}
                            onCheckedChange={() => toggleCat(c.id)}
                          />
                          <span className={c.isSub ? "pl-4" : ""}>
                            {c.name}
                          </span>
                        </label>
                        {selectedCats.has(c.id) ? (
                          <Button
                            type="button"
                            variant={defaultCat === c.id ? "default" : "outline"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setDefaultCat(c.id)}
                          >
                            Padrão
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
