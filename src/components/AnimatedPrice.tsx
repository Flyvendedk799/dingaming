import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedPriceProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showSavings?: boolean;
  animate?: boolean;
  className?: string;
}

const AnimatedPrice = ({
  price,
  originalPrice,
  currency = "kr",
  size = "md",
  showSavings = true,
  animate = true,
  className,
}: AnimatedPriceProps) => {
  const hasDiscount = originalPrice && originalPrice > price;
  const savings = hasDiscount ? Math.round(originalPrice - price) : 0;
  const discountPercent = hasDiscount 
    ? Math.round((1 - price / originalPrice) * 100) 
    : 0;

  const sizeClasses = {
    sm: {
      price: "text-lg font-bold",
      original: "text-xs",
      savings: "text-xs",
    },
    md: {
      price: "text-2xl font-bold",
      original: "text-sm",
      savings: "text-xs",
    },
    lg: {
      price: "text-3xl font-bold",
      original: "text-base",
      savings: "text-sm",
    },
    xl: {
      price: "text-4xl font-bold",
      original: "text-lg",
      savings: "text-sm",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-baseline gap-2 flex-wrap">
        {/* Main price with glow on discount */}
        <motion.span
          className={cn(
            sizes.price,
            hasDiscount ? "text-success" : "text-primary",
            hasDiscount && "relative"
          )}
          initial={animate ? { scale: 0.8, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          {hasDiscount && (
            <motion.span
              className="absolute inset-0 blur-lg bg-success/30 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
          <span className="relative">{Math.round(price)} {currency}</span>
        </motion.span>

        {/* Original price with strikethrough animation */}
        <AnimatePresence>
          {hasDiscount && (
            <motion.span
              className={cn(sizes.original, "text-muted-foreground relative")}
              initial={animate ? { opacity: 0, x: -10 } : false}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: 0.1 }}
            >
              <span className="relative">
                {Math.round(originalPrice)} {currency}
                <motion.span
                  className="absolute left-0 right-0 top-1/2 h-px bg-muted-foreground"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  style={{ transformOrigin: "left" }}
                />
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Savings indicator */}
      <AnimatePresence>
        {hasDiscount && showSavings && (
          <motion.div
            className="flex items-center gap-1.5 mt-1"
            initial={animate ? { opacity: 0, y: 5 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, 0],
              }}
              transition={{ 
                duration: 0.5,
                delay: 0.5,
              }}
            >
              <TrendingDown className="w-3.5 h-3.5 text-success" />
            </motion.div>
            <span className={cn(sizes.savings, "font-semibold text-success")}>
              Spar {savings} {currency}
            </span>
            {discountPercent >= 30 && (
              <motion.div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-success/10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                <Sparkles className="w-3 h-3 text-success" />
                <span className="text-[10px] font-bold text-success">-{discountPercent}%</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedPrice;
