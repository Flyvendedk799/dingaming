import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Trash2, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";

interface MobileCartProps {
  onBack: () => void;
}

const MobileCart = ({ onBack }: MobileCartProps) => {
  const navigate = useNavigate();
  const { items, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCartStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div 
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 -ml-2">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <div>
                <h1 className="font-heading text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Kurv
                </h1>
                <p className="text-xs text-muted-foreground">
                  {getTotalItems()} {getTotalItems() === 1 ? 'vare' : 'varer'}
                </p>
              </div>
            </div>
            {items.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearCart}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Tøm
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {items.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-semibold text-foreground mb-2">Din kurv er tom</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Find de bedste spil og tilføj dem til kurven
            </p>
            <Button onClick={onBack}>
              Se spil
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3 mb-6">
              {items.map((item, index) => (
                <motion.div
                  key={item.variantId}
                  className="flex gap-3 p-3 rounded-xl bg-card border border-border"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{item.title}</h3>
                    {item.sku && (
                      <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                        {item.sku}
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-success">
                        {formatPrice(parseFloat(item.price.amount))}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.variantId, Math.max(0, item.quantity - 1))}
                          className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <motion.div
              className="p-4 rounded-xl bg-card border border-border mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(getTotalPrice())}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Levering</span>
                <span className="text-success font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Gratis
                </span>
              </div>
              <div className="h-px bg-border my-3" />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-heading text-xl text-success">{formatPrice(getTotalPrice())}</span>
              </div>
            </motion.div>

            {/* Checkout Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={() => navigate("/checkout")}
                className="w-full h-12 bg-success hover:bg-success/90 text-success-foreground font-semibold"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Gå til kassen
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" />
                Keys leveres på 30 sekunder
              </p>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileCart;
