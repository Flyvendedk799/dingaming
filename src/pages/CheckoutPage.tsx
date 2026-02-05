import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Tag, 
  Loader2, 
  Shield, 
  Zap, 
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Minus,
  Plus,
  CreditCard,
  Lock,
  Sparkles,
  Gift,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cartStore";
import { applyDiscountCode, type DiscountResult } from "@/lib/shopify";
import { formatPrice } from "@/lib/shopify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { 
    items, 
    isLoading, 
    updateQuantity, 
    removeItem, 
    createCheckout,
    getTotalPrice,
    getTotalItems,
    clearCart
  } = useCartStore();
  
  const [discountCode, setDiscountCode] = useState("");
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    applicable: boolean;
    savings: number;
  } | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  
  const totalItems = getTotalItems();
  const subtotal = getTotalPrice();
  const discount = appliedDiscount?.applicable ? appliedDiscount.savings : 0;
  const total = subtotal - discount;
  const currency = items[0]?.price.currencyCode || 'DKK';

  // Redirect if cart is empty
  useEffect(() => {
    if (!isLoading && items.length === 0) {
      navigate('/');
    }
  }, [items, isLoading, navigate]);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    
    setIsApplyingDiscount(true);
    
    try {
      const result = await applyDiscountCode(
        items.map(item => ({ variantId: item.variantId, quantity: item.quantity })),
        discountCode.trim().toUpperCase()
      );
      
      if (result.applicable) {
        setAppliedDiscount({
          code: discountCode.trim().toUpperCase(),
          applicable: true,
          savings: result.savings
        });
        toast.success("Rabatkode anvendt!", {
          description: `Du sparer ${formatPrice(result.savings.toString(), currency)}`
        });
      } else {
        setAppliedDiscount({
          code: discountCode.trim().toUpperCase(),
          applicable: false,
          savings: 0
        });
        toast.error("Ugyldig rabatkode", {
          description: "Denne kode er ikke gyldig eller udløbet."
        });
      }
    } catch (error) {
      console.error('Error applying discount:', error);
      toast.error("Kunne ikke anvende rabatkode");
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
  };

  const handleCheckout = async () => {
    setIsCreatingCheckout(true);
    
    try {
      const checkoutUrl = await createCheckout();
      if (checkoutUrl) {
        // Apply discount to the checkout URL if applicable
        let finalUrl = checkoutUrl;
        if (appliedDiscount?.applicable && appliedDiscount.code) {
          const url = new URL(checkoutUrl);
          url.searchParams.set('discount', appliedDiscount.code);
          finalUrl = url.toString();
        }
        window.open(finalUrl, '_blank');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error("Checkout fejlede", {
        description: "Prøv venligst igen."
      });
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Back link */}
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Fortsæt shopping
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-heading text-2xl text-foreground">Gennemse din ordre</h1>
                  <p className="text-muted-foreground">
                    {totalItems} vare{totalItems !== 1 ? 'r' : ''} i din kurv
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.variantId}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="w-20 h-24 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col">
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-auto">
                          <Zap className="w-3 h-3 text-success" />
                          Instant levering
                        </div>
                        <p className="font-bold text-lg text-primary mt-2">
                          {formatPrice(item.price.amount, item.price.currencyCode)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.variantId)}
                        >
                          <Trash2 className="h-4 h-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30">
                  <Shield className="w-6 h-6 text-primary" />
                  <span className="text-xs text-center text-muted-foreground">Sikker betaling</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30">
                  <Zap className="w-6 h-6 text-success" />
                  <span className="text-xs text-center text-muted-foreground">30 sek levering</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30">
                  <Clock className="w-6 h-6 text-accent" />
                  <span className="text-xs text-center text-muted-foreground">24/7 support</span>
                </div>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card rounded-2xl border border-border/50 p-6"
                >
                  <h2 className="font-heading text-lg mb-6">Ordreoversigt</h2>

                  {/* Discount code */}
                  <div className="mb-6">
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Gift className="w-4 h-4 text-primary" />
                      Rabatkode
                    </label>
                    
                    {appliedDiscount?.applicable ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-success/10 border border-success/20"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          <span className="font-medium text-success">{appliedDiscount.code}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveDiscount}
                          className="h-8 text-muted-foreground hover:text-destructive"
                        >
                          Fjern
                        </Button>
                      </motion.div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Indtast kode"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                          className="flex-1"
                        />
                        <Button 
                          onClick={handleApplyDiscount}
                          disabled={!discountCode.trim() || isApplyingDiscount}
                          variant="outline"
                        >
                          {isApplyingDiscount ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Tag className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}

                    {appliedDiscount && !appliedDiscount.applicable && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1.5 text-xs text-destructive mt-2"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Ugyldig eller udløbet kode
                      </motion.p>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Price breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(subtotal.toString(), currency)}</span>
                    </div>
                    
                    {appliedDiscount?.applicable && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-success flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Rabat
                        </span>
                        <span className="text-success">-{formatPrice(discount.toString(), currency)}</span>
                      </motion.div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Moms (inkluderet)</span>
                      <span>{formatPrice((total * 0.2).toString(), currency)}</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold text-lg">Total</span>
                      <motion.span
                        key={total}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        className="font-bold text-2xl text-primary"
                      >
                        {formatPrice(total.toString(), currency)}
                      </motion.span>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Checkout button */}
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleCheckout}
                      disabled={isCreatingCheckout || items.length === 0}
                      className="w-full h-14 text-lg font-semibold"
                      size="lg"
                    >
                      {isCreatingCheckout ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Forbereder betaling...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Gå til betaling
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </motion.div>

                  <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-4">
                    <Lock className="w-3.5 h-3.5" />
                    Sikker betaling via Shopify
                  </p>
                </motion.div>

                {/* Savings callout */}
                {appliedDiscount?.applicable && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-success/10 to-primary/10 border border-success/20"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-5 h-5 text-success" />
                      <span className="font-semibold text-success">Godt klaret!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Du sparer {formatPrice(discount.toString(), currency)} på denne ordre med kode <strong>{appliedDiscount.code}</strong>
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
