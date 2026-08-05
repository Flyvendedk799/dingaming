import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  RefreshCw,
  Search,
  ShoppingBag,
  Wallet,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AdminOrder, fetchAdminOrders, summariseOrders } from "@/lib/adminApi";

const STATUSES = [
  { value: "all", label: "Alle" },
  { value: "pending", label: "Afventer" },
  { value: "paid", label: "Betalt" },
  { value: "fulfilling", label: "Afventer nøgler" },
  { value: "completed", label: "Gennemført" },
  { value: "failed", label: "Fejlet" },
  { value: "cancelled", label: "Annulleret" },
];

const money = (amount: number, currency = "DKK") =>
  new Intl.NumberFormat("da-DK", { style: "currency", currency }).format(amount || 0);

const when = (iso: string) => new Date(iso).toLocaleString("da-DK");

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="w-3 h-3" /> Gennemført
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" /> Fejlet
        </Badge>
      );
    case "fulfilling":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" /> Afventer nøgler
        </Badge>
      );
    case "paid":
      return <Badge className="gap-1">Betalt</Badge>;
    case "cancelled":
      return <Badge variant="outline">Annulleret</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

const OrdersTab = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setOrders(await fetchAdminOrders({ status, search }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunne ikke hente ordrer");
    } finally {
      setIsLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const totals = useMemo(() => summariseOrders(orders), [orders]);

  const copy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Kopieret");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ShoppingBag, label: "Ordrer", value: String(totals.count) },
          { icon: Wallet, label: "Omsætning (betalt)", value: money(totals.revenue) },
          { icon: Clock, label: "Afventer nøgler", value: String(totals.awaitingKeys) },
          { icon: AlertTriangle, label: "Fejlede", value: String(totals.failed) },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totals.failed > 0 && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">
                {totals.failed} {totals.failed === 1 ? "ordre" : "ordrer"} fejlede efter betaling.
              </p>
              <p className="text-muted-foreground">
                Kunden er trukket, men fik ingen nøgle. Åbn ordren for at se fejlen — den skyldes
                oftest for lav Kinguin-saldo. Refunder eller genudsend manuelt.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Kundeordrer
            </CardTitle>
            <CardDescription>Ordrer fra din egen butik — ikke Kinguin-ordrer.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Opdater
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Søg på e-mail eller ordrenummer"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[520px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordre</TableHead>
                    <TableHead>Dato</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Beløb</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Ingen ordrer endnu
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.order_number}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {when(order.created_at)}
                        </TableCell>
                        <TableCell className="text-sm">{order.email}</TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {money(order.total, order.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelected(order)}>
                            Detaljer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Ordre {selected?.order_number}
              {selected && <StatusBadge status={selected.status} />}
            </DialogTitle>
            <DialogDescription>
              {selected && `${selected.email} · ${when(selected.created_at)}`}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {selected.error_message && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    Levering fejlede
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{selected.error_message}</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Betaling</p>
                  <p className="font-medium">{selected.payment_status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Udbyder</p>
                  <p className="font-medium">{selected.payment_provider ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rabatkode</p>
                  <p className="font-medium">{selected.discount_code ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Shards givet</p>
                  <p className="font-medium">{selected.shards_awarded ?? 0}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="font-medium mb-2">Varer</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Spil</TableHead>
                      <TableHead className="text-center">Antal</TableHead>
                      <TableHead className="text-right">Pris</TableHead>
                      <TableHead>Nøgle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selected.order_items ?? []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{money(item.line_total, selected.currency)}</TableCell>
                        <TableCell>
                          {item.game_key ? (
                            <button
                              onClick={() => copy(item.game_key!)}
                              className="font-mono text-xs flex items-center gap-1 hover:text-primary"
                            >
                              {item.game_key}
                              <Copy className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Ikke leveret</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selected.keys && selected.keys.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Alle leverede nøgler</p>
                  <div className="space-y-2">
                    {selected.keys.map((k, i) => (
                      <div
                        key={`${k.key}-${i}`}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <span className="text-sm">{k.productName}</span>
                        <button
                          onClick={() => copy(k.key)}
                          className="font-mono text-xs flex items-center gap-1 hover:text-primary"
                        >
                          {k.key}
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{money(selected.subtotal, selected.currency)}</span>
                </div>
                {selected.discount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Rabat</span>
                    <span>-{money(selected.discount, selected.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{money(selected.total, selected.currency)}</span>
                </div>
                {selected.kinguin_order_id && (
                  <p className="text-xs text-muted-foreground pt-2">
                    Kinguin-ordre: {selected.kinguin_order_id}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Luk
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersTab;
