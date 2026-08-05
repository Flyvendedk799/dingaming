import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ImageOff,
  Lock,
  LockOpen,
  RefreshCw,
  Wallet,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CatalogueHealth,
  WebhookLog,
  callAdminFunction,
  clearSyncLock,
  fetchCatalogueHealth,
  fetchWebhookLogs,
} from "@/lib/adminApi";

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("da-DK") : "aldrig");

const minutesSince = (iso: string | null) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 60000) : null;

const OperationsTab = () => {
  const [health, setHealth] = useState<CatalogueHealth | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const loadBalance = useCallback(async () => {
    setBalanceError(null);
    try {
      const res = await callAdminFunction<{ balance: number }>("kinguin-balance");
      setBalance(res.balance);
    } catch (e) {
      // Surfaced rather than swallowed — a failing balance call usually means
      // the Kinguin key is wrong, which silently breaks fulfillment.
      setBalance(null);
      setBalanceError(e instanceof Error ? e.message : "Ukendt fejl");
    }
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [h, l] = await Promise.all([fetchCatalogueHealth(), fetchWebhookLogs(15)]);
      setHealth(h);
      setLogs(l);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunne ikke hente status");
    } finally {
      setIsLoading(false);
    }
    void loadBalance();
  }, [loadBalance]);

  useEffect(() => {
    void load();
  }, [load]);

  const runSync = async () => {
    setBusy("sync");
    try {
      const res = await callAdminFunction<{ synced?: number; caughtUp?: boolean; skipped?: boolean; reason?: string }>(
        "kinguin-auto-sync",
      );
      if (res.skipped) {
        toast.info(`Sync sprunget over: ${res.reason ?? "kører allerede"}`);
      } else {
        toast.success(
          `Synkroniserede ${res.synced ?? 0} produkter${res.caughtUp === false ? " (ikke helt ajour — kør igen)" : ""}`,
        );
      }
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync fejlede");
    } finally {
      setBusy(null);
    }
  };

  const unlock = async () => {
    setBusy("unlock");
    try {
      await clearSyncLock();
      toast.success("Sync-låsen er ryddet");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunne ikke rydde låsen");
    } finally {
      setBusy(null);
    }
  };

  if (isLoading || !health) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const lockAge = minutesSince(health.lock.started_at);
  const lockIsStale = health.lock.locked && lockAge !== null && lockAge > 15;
  const syncAge = minutesSince(health.lastSync);
  const syncIsStale = syncAge === null || syncAge > 180;

  return (
    <div className="space-y-6">
      {balance === 0 && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Kinguin-saldoen er 0 EUR.</p>
              <p className="text-muted-foreground">
                Rigtige ordrer kan ikke leveres. Kunden bliver trukket, ordren fejler, og du skal
                refundere manuelt. Fyld saldoen op før du sætter Stripe live.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Kinguin-saldo</p>
                <p className="text-2xl font-bold">
                  {balanceError ? "—" : balance !== null ? `€${balance.toFixed(2)}` : "…"}
                </p>
                {balanceError && (
                  <p className="text-xs text-destructive truncate" title={balanceError}>
                    {balanceError}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produkter til salg</p>
                <p className="text-2xl font-bold">{health.available.toLocaleString("da-DK")}</p>
                <p className="text-xs text-muted-foreground">
                  af {health.total.toLocaleString("da-DK")} i alt
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <ImageOff className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uden billede</p>
                <p className="text-2xl font-bold">{health.missingArtwork.toLocaleString("da-DK")}</p>
                <p className="text-xs text-muted-foreground">skjult på forsiden</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fremhævet / tilbud</p>
                <p className="text-2xl font-bold">
                  {health.featured} / {health.onSale}
                </p>
                {health.onSale === 0 && (
                  <p className="text-xs text-muted-foreground">Tilbudssiden er tom</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Katalog-synkronisering
            </CardTitle>
            <CardDescription>
              Kører automatisk hver time. Webhooken fra Kinguin opdaterer enkeltprodukter med det samme.
            </CardDescription>
          </div>
          <Button onClick={runSync} disabled={busy !== null}>
            <RefreshCw className={`w-4 h-4 mr-2 ${busy === "sync" ? "animate-spin" : ""}`} />
            Synk nu
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Sidste sync</p>
              <p className="font-medium">{when(health.lastSync)}</p>
              {syncIsStale && (
                <Badge variant="destructive" className="mt-1">
                  Forældet
                </Badge>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Backfill</p>
              <p className="font-medium">{health.backfillComplete ? "Fuldført" : "Ikke fuldført"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Lås</p>
              <p className="font-medium flex items-center gap-2">
                {health.lock.locked ? (
                  <>
                    <Lock className="w-4 h-4 text-destructive" /> Låst
                    {lockAge !== null && ` (${lockAge} min)`}
                  </>
                ) : (
                  <>
                    <LockOpen className="w-4 h-4 text-muted-foreground" /> Fri
                  </>
                )}
              </p>
            </div>
          </div>

          {lockIsStale && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 flex items-start justify-between gap-4">
              <div className="text-sm">
                <p className="font-medium">Låsen har hængt i {lockAge} minutter.</p>
                <p className="text-muted-foreground">
                  Et sync-kørsel er sandsynligvis død undervejs. Ryd låsen, så synkroniseringen kan
                  køre igen.
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={unlock} disabled={busy !== null}>
                Ryd lås
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Webhook-log
            </CardTitle>
            <CardDescription>Seneste beskeder fra Kinguin.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Opdater
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hændelse</TableHead>
                  <TableHead>Tidspunkt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                      Ingen webhooks modtaget endnu — er webhooken sat op hos Kinguin?
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline">{log.event_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {when(log.processed_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationsTab;
