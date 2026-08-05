import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Gift, Gamepad2, Package, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnhancedBalanceCardProps {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  isLoading?: boolean;
}

const EnhancedBalanceCard = ({ 
  balance, 
  lifetimeEarned, 
  lifetimeSpent, 
  isLoading 
}: EnhancedBalanceCardProps) => {
  const formatShards = (shards: number) => {
    return new Intl.NumberFormat('da-DK').format(shards);
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-club/30 via-club/10 to-primary/20" />
      
      {/* Animated orbs */}
      <motion.div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-club/20 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-primary/20 blur-3xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* Glass overlay */}
      <div className="relative border border-club/30 rounded-3xl backdrop-blur-sm p-6 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-12 h-12 rounded-2xl bg-club/20 flex items-center justify-center"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles className="w-6 h-6 text-club" />
            </motion.div>
            <div>
              <p className="text-sm text-muted-foreground">Din Shard Balance</p>
              <div className="flex items-center gap-2">
                <motion.span
                  className="text-xs text-club flex items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <TrendingUp className="w-3 h-3" />
                  Aktiv
                </motion.span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Display */}
        <div className="mb-8">
          <motion.div
            className="flex items-baseline gap-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <span className="font-heading text-5xl md:text-6xl lg:text-7xl text-club tracking-tight">
              {isLoading ? '...' : formatShards(balance)}
            </span>
            <span className="text-2xl text-muted-foreground">Shards</span>
          </motion.div>
          
          <motion.p
            className="text-muted-foreground mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            ≈ <span className="text-foreground font-medium">{(balance / 1000).toFixed(2)} DKK</span> værdi
          </motion.p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            className="p-4 rounded-2xl bg-background/50 border border-border/50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs text-muted-foreground mb-1">Optjent Total</p>
            <p className="font-heading text-xl text-foreground">{formatShards(lifetimeEarned)}</p>
          </motion.div>
          <motion.div
            className="p-4 rounded-2xl bg-background/50 border border-border/50"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-xs text-muted-foreground mb-1">Brugt Total</p>
            <p className="font-heading text-xl text-foreground">{formatShards(lifetimeSpent)}</p>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/club/rewards" className="block">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="w-full h-auto py-3 flex flex-col items-center gap-1 bg-club hover:bg-club/90 text-club-foreground">
                <Gift className="w-5 h-5" />
                <span className="text-xs">Rewards</span>
              </Button>
            </motion.div>
          </Link>
          <Link to="/club/games" className="block">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-1 border-club text-club hover:bg-club/10">
                <Gamepad2 className="w-5 h-5" />
                <span className="text-xs">Spil</span>
              </Button>
            </motion.div>
          </Link>
          <Link to="/club/cases" className="block">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-1 border-primary text-primary hover:bg-primary/10">
                <Package className="w-5 h-5" />
                <span className="text-xs">Cases</span>
              </Button>
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedBalanceCard;
