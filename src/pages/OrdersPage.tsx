import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Key, RefreshCw, Clock, CheckCircle, AlertCircle, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface OrderProduct {
  kinguinId: number;
  qty: number;
  price: number;
  name?: string;
}

interface OrderKey {
  productName: string;
  key: string;
  type: string;
}

interface Order {
  id: string;
  order_id: string;
  order_external_id: string | null;
  status: string;
  total_price: number;
  products: OrderProduct[];
  keys: OrderKey[] | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  processing: { label: "Behandler", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  completed: { label: "Fuldført", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle },
  failed: { label: "Fejlet", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle },
};

const OrdersPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("kinguin_orders")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      toast.error("Kunne ikke hente ordrer");
    } else {
      setOrders((data as unknown as Order[]) || []);
    }
    setLoading(false);
  };

  const refreshOrder = async (orderId: string) => {
    setRefreshing(orderId);
    try {
      const { data } = await supabase.functions.invoke("kinguin-get-order", {
        body: { orderId },
      });
      if (data) {
        await fetchOrders();
        toast.success("Ordre opdateret");
      }
    } catch {
      toast.error("Kunne ikke opdatere ordre");
    }
    setRefreshing(null);
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Nøgle kopieret!");
  };

  const toggleKeyVisibility = (keyId: string) => {
    setRevealedKeys(prev => {
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
              const config = statusConfig[order.status] || statusConfig.processing;
              const StatusIcon = config.icon;
              return (
                <div key={order.id} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={config.color}>
                        <StatusIcon className="w-3.5 h-3.5 mr-1" />
                        {config.label}
                      </Badge>
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {Number(order.total_price).toFixed(2)} DKK
                      </span>
                      {order.status !== "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => refreshOrder(order.order_id)}
                          disabled={refreshing === order.order_id}
                        >
                          <RefreshCw className={`w-4 h-4 ${refreshing === order.order_id ? "animate-spin" : ""}`} />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Products */}
                  <div className="mb-4 space-y-1">
                    {(order.products as unknown as OrderProduct[]).map((p, i) => (
                      <p key={i} className="text-sm text-foreground">
                        {p.name || `Produkt #${p.kinguinId}`} <span className="text-muted-foreground">× {p.qty}</span>
                      </p>
                    ))}
                  </div>

                  {/* Keys */}
                  {order.status === "completed" && order.keys && (order.keys as unknown as OrderKey[]).length > 0 && (
                    <div className="bg-background/50 border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Dine spilnøgler</span>
                      </div>
                      {(order.keys as unknown as OrderKey[]).map((k, i) => {
                        const keyId = `${order.id}-${i}`;
                        const isRevealed = revealedKeys.has(keyId);
                        return (
                          <div key={i} className="flex items-center justify-between bg-card rounded-lg px-4 py-3 border border-border">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{k.productName}</p>
                              <p className="font-mono text-sm text-foreground">
                                {isRevealed ? k.key : "••••-••••-••••-••••"}
                              </p>
                            </div>
                            <div className="flex gap-1">
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
                  )}

                  {order.status === "processing" && (
                    <p className="text-sm text-muted-foreground italic">
                      Dine nøgler vil blive vist her, når ordren er fuldført.
                    </p>
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
