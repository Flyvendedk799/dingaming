import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ShoppingBag, Key, Copy, Clock } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { fetchOrderById, type OrderRow } from "@/lib/kinguin";
import { formatDKK } from "@/lib/pricing";
import { toast } from "sonner";
import { useSeo } from "@/lib/seo";

interface LocationOrder {
  orderId: string;
  orderNumber: string;
  total: number;
  status: string;
}

const ThankYouPage = () => {
  useSeo({ title: "Tak for din ordre", path: "/thank-you", noindex: true });
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const clearCart = useCartStore((s) => s.clearCart);

  const passed = (location.state as { order?: LocationOrder } | null)?.order ?? null;
  const [order, setOrder] = useState<OrderRow | null>(null);

  // Ensure the cart is empty once the purchase has gone through.
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Logged-in buyers can see their delivered keys immediately (RLS-gated).
  useEffect(() => {
    if (passed?.orderId && user) {
      fetchOrderById(passed.orderId).then(setOrder);
    }
  }, [passed?.orderId, user]);

  const keys = order?.keys ?? [];
  const pending = passed?.status === "pending_payment" || passed?.status === "fulfilling";

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Nøgle kopieret!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-32 pb-16 max-w-2xl text-center">
        <div className="bg-card border border-border rounded-2xl p-10 space-y-6">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">Tak for dit køb!</h1>

          {passed && (
            <p className="text-muted-foreground">
              Ordrenummer <span className="font-mono font-semibold text-foreground">{passed.orderNumber}</span>
              {" · "}
              {formatDKK(passed.total)}
            </p>
          )}

          <p className="text-muted-foreground text-lg">
            {pending
              ? "Din betaling behandles. Dine spilnøgler er klar om få minutter under “Mine ordrer”."
              : "Din ordre er gennemført. Dine spilnøgler er leveret – se dem herunder eller under “Mine ordrer”."}
          </p>

          {/* Delivered keys */}
          {keys.length > 0 && (
            <div className="text-left space-y-2 bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Key className="w-4 h-4 text-primary" /> Dine spilnøgler
              </div>
              {keys.map((k, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 bg-background rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{k.productName}</p>
                    <p className="font-mono text-sm text-foreground truncate">{k.key}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyKey(k.key)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {pending && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" /> Behandler levering...
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            {user ? (
              <Button onClick={() => navigate("/orders")} className="gap-2" size="lg">
                <Package className="w-5 h-5" />
                Se mine ordrer
              </Button>
            ) : (
              <Button onClick={() => navigate("/login")} className="gap-2" size="lg">
                <Package className="w-5 h-5" />
                Log ind for at se dine nøgler
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2" size="lg">
              <ShoppingBag className="w-5 h-5" />
              Fortsæt med at handle
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ThankYouPage;
