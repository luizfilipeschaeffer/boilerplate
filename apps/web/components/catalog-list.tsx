"use client";

import { deleteCatalogAction } from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type CatalogListItem = {
  id: string;
  name: string;
  itemType: string;
  sku: string | null;
  priceCents: number | null;
};

function formatPrice(cents: number | null) {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function CatalogList({ items }: { items: CatalogListItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum item no catálogo. Adicione o primeiro acima.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead className="text-right">Preço</TableHead>
          <TableHead className="w-[80px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="capitalize">{item.itemType}</TableCell>
            <TableCell>{item.sku ?? "—"}</TableCell>
            <TableCell className="text-right">
              {formatPrice(item.priceCents)}
            </TableCell>
            <TableCell>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void deleteCatalogAction(item.id)}
              >
                Excluir
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
