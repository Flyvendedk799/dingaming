import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, RefreshCw, Ticket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DiscountCode,
  deleteDiscountCode,
  fetchDiscountCodes,
  saveDiscountCode,
  setDiscountCodeActive,
} from "@/lib/adminApi";

const emptyForm = {
  id: undefined as string | undefined,
  code: "",
  type: "percent",
  value: 10,
  min_subtotal: 0,
  max_uses: "" as string | number,
  expires_at: "",
  is_active: true,
};

const DiscountCodesTab = () => {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DiscountCode | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setCodes(await fetchDiscountCodes());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunne ikke hente rabatkoder");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openNew = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (code: DiscountCode) => {
    setForm({
      id: code.id,
      code: code.code,
      type: code.type,
      value: Number(code.value),
      min_subtotal: Number(code.min_subtotal ?? 0),
      max_uses: code.max_uses ?? "",
      expires_at: code.expires_at ? code.expires_at.slice(0, 10) : "",
      is_active: code.is_active,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.code.trim()) {
      toast.error("Koden skal have et navn");
      return;
    }
    if (!Number.isFinite(Number(form.value)) || Number(form.value) <= 0) {
      toast.error("Værdien skal være større end 0");
      return;
    }
    setSaving(true);
    try {
      await saveDiscountCode({
        id: form.id,
        code: form.code,
        type: form.type,
        value: Number(form.value),
        min_subtotal: Number(form.min_subtotal) || 0,
        max_uses: form.max_uses === "" ? null : Number(form.max_uses),
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        is_active: form.is_active,
      });
      toast.success(form.id ? "Rabatkode opdateret" : "Rabatkode oprettet");
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunne ikke gemme");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (code: DiscountCode) => {
    try {
      await setDiscountCodeActive(code.id, !code.is_active);
      toast.success(code.is_active ? "Deaktiveret" : "Aktiveret");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunne ikke ændre status");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteDiscountCode(pendingDelete.id);
      toast.success("Rabatkode slettet");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunne ikke slette");
    } finally {
      setPendingDelete(null);
    }
  };

  const describe = (c: DiscountCode) =>
    c.type === "percent" ? `${Number(c.value)}%` : `${Number(c.value).toFixed(2)} kr.`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Rabatkoder
            </CardTitle>
            <CardDescription>
              Koderne er ikke synlige for kunder — de skal indtastes i kurven for at virke.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Opdater
            </Button>
            <Button size="sm" onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" />
              Ny kode
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Rabat</TableHead>
                  <TableHead>Min. køb</TableHead>
                  <TableHead>Brugt</TableHead>
                  <TableHead>Udløber</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Ingen rabatkoder endnu
                    </TableCell>
                  </TableRow>
                ) : (
                  codes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono font-medium">{code.code}</TableCell>
                      <TableCell>{describe(code)}</TableCell>
                      <TableCell>
                        {Number(code.min_subtotal) > 0
                          ? `${Number(code.min_subtotal).toFixed(2)} kr.`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {code.used_count}
                        {code.max_uses ? ` / ${code.max_uses}` : ""}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {code.expires_at ? new Date(code.expires_at).toLocaleDateString("da-DK") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={code.is_active ? "default" : "secondary"}>
                          {code.is_active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(code)}>
                          Rediger
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggle(code)}>
                          {code.is_active ? "Deaktiver" : "Aktiver"}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setPendingDelete(code)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Rediger rabatkode" : "Ny rabatkode"}</DialogTitle>
            <DialogDescription>Koden gemmes med store bogstaver.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Kode</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SOMMER25"
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Procent</SelectItem>
                    <SelectItem value="fixed">Fast beløb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">{form.type === "percent" ? "Procent" : "Beløb (kr.)"}</Label>
                <Input
                  id="value"
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min">Min. købsbeløb (kr.)</Label>
                <Input
                  id="min"
                  type="number"
                  value={form.min_subtotal}
                  onChange={(e) => setForm({ ...form, min_subtotal: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="max">Maks. antal brug</Label>
                <Input
                  id="max"
                  type="number"
                  value={form.max_uses}
                  placeholder="Ubegrænset"
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expires">Udløbsdato</Label>
              <Input
                id="expires"
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuller
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Gemmer…" : "Gem"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet rabatkoden?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.code} slettes permanent. Allerede afgivne ordrer påvirkes ikke.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Slet</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DiscountCodesTab;
