import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Key, Clock, CheckCircle, AlertCircle, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { fetchMyOrders, type OrderRow } from "@/lib/kinguin";
import { formatDKK } from "@/lib/pricing";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Afventer betaling", color: "bg-muted text-muted-foreground border-border", icon: Clock },
  paid: { label: "Betalt", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: CheckCircle },
  fulfilling: { label: "Behandler", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  completed: { label: "Fuldført", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle },
  failed: { label: "Fejlet", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle },
  cancelled: { label: "Annulleret", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle },
};

const OrdersPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchMyOrders()
        .then(setOrders)
        .catch(() => toast.error("Kunne ikke hente ordrer"))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Nøgle kopieret!");
  };

  const toggleKeyVisibility = (keyId: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) next.delete(keyId);
      else next.add(keyId);
      return next;
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-32 pb-16 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Package className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Mine Ordrer</h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Ingen ordrer endnu</h2>
            <p className="text-muted-foreground mb-6">Når du køber spil, vises de her med dine nøgler.</p>
            <Button onClick={() => navigate("/")} className="bg-primary text-primary-foreground">
              Udforsk spil
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const keys = order.keys ?? [];
              return (
                <div key={order.id} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={config.color}>
                        <StatusIcon className="w-3.5 h-3.5 mr-1" />
                        {config.label}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">{order.order_number}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("da-DK", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{formatDKK(Number(order.total))}</span>
                  </div>

                  {/* Products */}
                  <div className="mb-4 space-y-1">
                    {(order.order_items ?? []).map((p) => (
                      <p key={p.id} className="text-sm text-foreground">
                        {p.name} <span className="text-muted-foreground">× {p.quantity}</span>
                      </p>
                    ))}
                  </div>

                  {/* Keys */}
                  {keys.length > 0 ? (
                    <div className="bg-background/50 border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Dine spilnøgler</span>
                      </div>
                      {keys.map((k, i) => {
                        const keyId = `${order.id}-${i}`;
                        const isRevealed = revealedKeys.has(keyId);
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between bg-card rounded-lg px-4 py-3 border border-border"
                          >
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground mb-1 truncate">{k.productName}</p>
                              <p className="font-mono text-sm text-foreground truncate">
                                {isRevealed ? k.key : "••••-••••-••••"}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="sm" onClick={() => toggleKeyVisibility(keyId)}>
                                {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => copyKey(k.key)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    order.status !== "completed" && (
                      <p className="text-sm text-muted-foreground italic">
                        Dine nøgler vises her, så snart ordren er fuldført.
                      </p>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrdersPage;
