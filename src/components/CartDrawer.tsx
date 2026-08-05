import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Loader2, 
  Shield, 
  Zap, 
  Clock,
  Package,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatDKK } from "@/lib/pricing";
import { Link } from "react-router-dom";

export const CartDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { 
    items, 
    isLoading, 
    updateQuantity, 
    removeItem,
    getTotalPrice,
    getTotalItems,
    getTotalSavings
  } = useCartStore();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const estimatedSavings = getTotalSavings();

  const handleRemove = async (variantId: string) => {
    setRemovingId(variantId);
    await new Promise(r => setTimeout(r, 200));
    removeItem(variantId);
    setRemovingId(null);
  };

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="relative gap-2 border-primary/30 hover:border-primary hover:bg-primary/5 group"
        >
          <motion.div
            animate={totalItems > 0 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <ShoppingCart className="h-5 w-5 group-hover:text-primary transition-colors" />
          </motion.div>
          <span className="hidden sm:inline font-medium">Kurv</span>
          <AnimatePresence>
            {totalItems > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-2"
              >
                <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                  {totalItems}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
        <SheetHeader className="flex-shrink-0 p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="font-heading text-left">Din Kurv</SheetTitle>
              <SheetDescription className="text-left">
                {totalItems === 0 ? "Din kurv er tom" : `${totalItems} vare${totalItems !== 1 ? 'r' : ''} klar til checkout`}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex flex-col flex-1 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">Din kurv er tom</p>
                <Link to="/" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="gap-2">
                    Udforsk spil
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Cart items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.variantId}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: removingId === item.variantId ? 0.5 : 1, 
                        x: 0,
                        scale: removingId === item.variantId ? 0.95 : 1
                      }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      className="flex gap-4 p-4 bg-card rounded-xl border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="w-16 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col">
                        <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                          {item.title}
                        </h4>
                        <div className="mb-auto flex items-center gap-2 text-xs text-muted-foreground">
                          <Zap className="h-3 w-3 text-primary" />
                          Nøgle på e-mail inden for 60 sekunder
                        </div>
                        <p className="font-bold text-primary mt-2">
                          {formatDKK(parseFloat(item.price.amount))}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(item.variantId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              {/* Checkout section */}
              <div className="flex-shrink-0 border-t border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-4">
                {/* Savings banner */}
                {estimatedSavings > 5 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20"
                  >
                    <Sparkles className="w-4 h-4 text-success" />
                    <span className="text-sm text-success font-medium">
                      Du sparer {formatDKK(estimatedSavings)} på denne ordre!
                    </span>
                  </motion.div>
                )}

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-6 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    Sikker betaling
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Levering inden for 60 sekunder
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center py-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-xs text-muted-foreground block">inkl. moms</span>
                  </div>
                  <motion.span
                    key={totalPrice}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-primary"
                  >
                    {formatDKK(totalPrice)}
                  </motion.span>
                </div>
                
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={handleCheckout}
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold" 
                    size="lg"
                    disabled={items.length === 0 || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Opretter checkout...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-5 h-5 mr-2" />
                        Gå til kassen
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
