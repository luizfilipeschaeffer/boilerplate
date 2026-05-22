"use client";

import * as React from "react";
import {
  createBranchAction,
  listBranchesAction,
  updateBranchAction,
} from "@/app/actions/branches";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

export function ConfigFiliaisView() {
  const [branches, setBranches] = React.useState<
    Awaited<ReturnType<typeof listBranchesAction>>
  >([]);
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      setBranches(await listBranchesAction());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova filial</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Nome da filial"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            onClick={async () => {
              if (!name.trim()) return;
              await createBranchAction({ name: name.trim() });
              setName("");
              await reload();
            }}
          >
            Adicionar
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Filiais</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.name}</TableCell>
                    <TableCell>
                      {b.is_default ? (
                        <Badge>Matriz</Badge>
                      ) : b.active ? (
                        <Badge variant="secondary">Ativa</Badge>
                      ) : (
                        <Badge variant="outline">Inativa</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!b.is_default && b.active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void updateBranchAction({
                              id: b.id,
                              active: false,
                            }).then(reload)
                          }
                        >
                          Inativar
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
    </div>
  );
}
