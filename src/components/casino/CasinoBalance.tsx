import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useShardBalance } from "@/hooks/useShards";

const CasinoBalance = () => {
  const { data: balance, isLoading } = useShardBalance();

  const formatShards = (shards: number) => {
    return new Intl.NumberFormat("da-DK").format(shards);
  };

  return (
    <motion.div
      className="relative px-5 py-3 rounded-2xl overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Glowing background */}
      <div className="absolute inset-0 bg-gradient-to-r from-success/20 via-success/10 to-primary/20 backdrop-blur-sm" />
      <motion.div
        className="absolute inset-0 bg-success/10"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div className="absolute inset-0 border border-success/30 rounded-2xl" />

      <div className="relative flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5 text-success" />
          </motion.div>
        </div>

        <div>
          <p className="text-[10px] text-white/50 uppercase tracking-wider">
            Balance
          </p>
          <motion.p
            key={balance?.balance}
            className="font-heading text-xl text-success"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
          >
            {isLoading ? "..." : formatShards(balance?.balance || 0)}
            <span className="text-sm text-white/50 ml-1.5">Shards</span>
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default CasinoBalance;
