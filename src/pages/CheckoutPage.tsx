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
  Mail,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/contexts/AuthContext";
import { createOrder, processPayment, validateDiscount } from "@/lib/kinguin";
import { formatDKK } from "@/lib/pricing";
import Header, { DELIVERY_PROMISE } from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const isValidEmail = (email: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items,
    isLoading,
    updateQuantity,
    removeItem,
    getTotalPrice,
    getTotalItems,
    clearCart,
  } = useCartStore();

  const [email, setEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; savings: number } | null>(
    null
  );
  const [discountError, setDiscountError] = useState(false);
  // The code field stays closed until asked for. An open box above the price
  // breakdown reads as "everyone else has a code" and sends people off to hunt
  // for one instead of paying.
  const [showDiscountField, setShowDiscountField] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const totalItems = getTotalItems();
  const subtotal = getTotalPrice();
  const discount = appliedDiscount?.savings ?? 0;
  const total = Math.max(0, subtotal - discount);
  const vatPortion = total - total / 1.25;

  // Pre-fill from the logged-in user.
  useEffect(() => {
    if (user?.email) setEmail((prev) => prev || user.email!);
    const name = (user?.user_metadata as { display_name?: string } | undefined)?.display_name;
    if (name) setCustomerName((prev) => prev || name);
  }, [user]);

  // Redirect if cart is empty (but not while we're completing an order).
  useEffect(() => {
    if (!isLoading && items.length === 0 && !isPlacingOrder) {
      navigate("/");
    }
  }, [items, isLoading, navigate, isPlacingOrder]);

  const handleApplyDiscount = async () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) return;

    setIsApplyingDiscount(true);
    setDiscountError(false);
    try {
      const result = await validateDiscount(code, subtotal);
      if (result.valid && result.savings > 0) {
        setAppliedDiscount({ code, savings: result.savings });
        toast.success("Rabatkode anvendt!", {
          description: `Du sparer ${formatDKK(result.savings)}`,
        });
      } else {
        setAppliedDiscount(null);
        setDiscountError(true);
        toast.error("Ugyldig rabatkode", {
          description: "Denne kode er ikke gyldig, udløbet eller opfylder ikke kravene.",
        });
      }
    } catch {
      toast.error("Kunne ikke validere rabatkode");
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError(false);
  };

  const handlePlaceOrder = async () => {
    if (!isValidEmail(email)) {
      toast.error("Indtast en gyldig email", {
        description: "Vi sender dine spilnøgler hertil.",
      });
      return;
    }

    setIsPlacingOrder(true);
    try {
      const created = await createOrder({
        items: items.map((i) => ({ kinguinId: i.kinguinId, quantity: i.quantity })),
        email: email.trim(),
        customerName: customerName.trim() || undefined,
        discountCode: appliedDiscount?.code,
      });

      const payment = await processPayment(created.orderId);

      if (payment.mode === "stripe") {
        // Stripe is configured: the client_secret would be confirmed with
        // Stripe.js / Elements here. That UI is wired up once Stripe keys are
        // connected; until then we surface the state clearly.
        toast.info("Betaling klar", {
          description: "Stripe er konfigureret – fuldfør betalingen i betalingsvinduet.",
        });
        navigate("/thank-you", {
          state: {
            order: { ...created, status: "pending_payment", clientSecret: payment.clientSecret },
          },
        });
        return;
      }

      // Dev / already-paid path: order is paid and fulfilled.
      clearCart();
      navigate("/thank-you", {
        state: { order: { ...created, status: payment.status ?? "completed" } },
      });
    } catch (error) {
      console.error("Order failed:", error);
      const message = error instanceof Error ? error.message : "Prøv venligst igen.";
      toast.error("Bestilling fejlede", { description: message });
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0 && !isPlacingOrder) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Fortsæt shopping
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: items + contact details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-heading text-2xl text-foreground">Kasse</h1>
                  <p className="text-muted-foreground">
                    {totalItems} vare{totalItems !== 1 ? "r" : ""} i din kurv
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
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-1">{item.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-auto">
                          <Zap className="w-3 h-3 text-success" />
                          Instant levering
                        </div>
                        <p className="font-bold text-lg text-primary mt-2">
                          {formatDKK(parseFloat(item.price.amount))}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.variantId)}
                        >
                          <Trash2 className="h-4 w-4" />
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

              {/* Contact details */}
              <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
                <h2 className="font-heading text-lg">Leveringsoplysninger</h2>
                <p className="text-sm text-muted-foreground -mt-2">
                  Dine spilnøgler leveres øjeblikkeligt og kan ses under "Mine ordrer".
                </p>
                <div className="space-y-3">
                  <label className="block">
                    <span className="flex items-center gap-2 text-sm font-medium mb-1.5">
                      <Mail className="w-4 h-4 text-primary" /> Email *
                    </span>
                    <Input
                      type="email"
                      placeholder="din@email.dk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="flex items-center gap-2 text-sm font-medium mb-1.5">
                      <UserIcon className="w-4 h-4 text-primary" /> Navn (valgfrit)
                    </span>
                    <Input
                      placeholder="Dit navn"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </label>
                </div>
                {!user && (
                  <p className="text-xs text-muted-foreground">
                    <Link to="/login" className="text-primary hover:underline">
                      Log ind
                    </Link>{" "}
                    for at optjene shards og gemme dine ordrer.
                  </p>
                )}
              </div>
            </div>

            {/* Right: order summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card rounded-2xl border border-border/50 p-6"
                >
                  <h2 className="font-heading text-lg mb-6">Ordreoversigt</h2>

                  {/* Price breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatDKK(subtotal)}</span>
                    </div>

                    {appliedDiscount && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-success flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Rabat
                        </span>
                        <span className="text-success">-{formatDKK(discount)}</span>
                      </motion.div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Heraf moms (25%)</span>
                      <span>{formatDKK(vatPortion)}</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold text-lg">Total</span>
                      <span className="num font-bold text-2xl text-primary">{formatDKK(total)}</span>
                    </div>
                  </div>

                  {/* Discount code, below the total and closed by default. */}
                  <div className="mt-4">
                    {appliedDiscount ? (
                      <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="num font-medium text-primary">{appliedDiscount.code}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveDiscount}
                          className="h-8 text-muted-foreground hover:text-destructive"
                        >
                          Fjern
                        </Button>
                      </div>
                    ) : showDiscountField ? (
                      <div>
                        <div className="flex gap-2">
                          <Input
                            autoFocus
                            placeholder="Indtast rabatkode"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleApplyDiscount()}
                            className="num flex-1"
                          />
                          <Button
                            onClick={handleApplyDiscount}
                            disabled={!discountCode.trim() || isApplyingDiscount}
                            variant="outline"
                          >
                            {isApplyingDiscount ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Brug"
                            )}
                          </Button>
                        </div>
                        {discountError && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                            <XCircle className="h-3.5 w-3.5" />
                            Ugyldig eller udløbet kode
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowDiscountField(true)}
                        className="text-sm text-muted-foreground underline underline-offset-4 transition-colors duration-fast hover:text-foreground"
                      >
                        Har du en rabatkode?
                      </button>
                    )}
                  </div>

                  <Separator className="my-6" />

                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={isPlacingOrder || items.length === 0 || !isValidEmail(email)}
                      className="w-full h-14 text-lg font-semibold"
                      size="lg"
                    >
                      {isPlacingOrder ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Behandler ordre...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Gennemfør køb
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {/* "Stripe (kommer snart)" used to sit here. Nobody types a
                      card number under a "coming soon". */}
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" />
                    Sikker betaling gennem Stripe
                  </p>
                </motion.div>

                {/* One colour across the row — these were primary, success and
                    accent in a line, which reads as three unrelated claims. */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Shield, label: "Officielle nøgler" },
                    { icon: Zap, label: DELIVERY_PROMISE },
                    { icon: Clock, label: "Svar inden 24 timer" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-muted/30 p-3"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-center text-xs leading-snug text-muted-foreground">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
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
