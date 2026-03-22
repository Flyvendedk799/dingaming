import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

const ThankYouPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const clearCart = useCartStore((s) => s.clearCart);

  // Clear the cart on arrival
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-32 pb-16 max-w-2xl text-center">
        <div className="bg-card border border-border rounded-2xl p-10 space-y-6">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">Tak for dit køb!</h1>
          <p className="text-muted-foreground text-lg">
            Din ordre er modtaget og bliver behandlet. Dine spilnøgler vil være klar inden for få minutter.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            {user ? (
              <Button
                onClick={() => navigate("/orders")}
                className="bg-primary text-primary-foreground gap-2"
                size="lg"
              >
                <Package className="w-5 h-5" />
                Se mine ordrer
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/login")}
                className="bg-primary text-primary-foreground gap-2"
                size="lg"
              >
                <Package className="w-5 h-5" />
                Log ind for at se dine nøgler
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="gap-2"
              size="lg"
            >
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
