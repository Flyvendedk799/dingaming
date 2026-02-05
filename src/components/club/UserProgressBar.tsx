import { motion } from "framer-motion";
import { Crown, Star, Gem, Trophy, Sparkles } from "lucide-react";

interface UserProgressBarProps {
  currentShards: number;
  lifetimeEarned: number;
}

const TIERS = [
  { name: "Bronze", minShards: 0, icon: Star, color: "text-amber-600", bgColor: "bg-amber-600/20", borderColor: "border-amber-600/40" },
  { name: "Sølv", minShards: 10000, icon: Gem, color: "text-slate-400", bgColor: "bg-slate-400/20", borderColor: "border-slate-400/40" },
  { name: "Guld", minShards: 50000, icon: Crown, color: "text-primary", bgColor: "bg-primary/20", borderColor: "border-primary/40" },
  { name: "Platinum", minShards: 100000, icon: Trophy, color: "text-cyan-400", bgColor: "bg-cyan-400/20", borderColor: "border-cyan-400/40" },
  { name: "Diamond", minShards: 250000, icon: Sparkles, color: "text-violet-400", bgColor: "bg-violet-400/20", borderColor: "border-violet-400/40" },
];

const UserProgressBar = ({ currentShards, lifetimeEarned }: UserProgressBarProps) => {
  const getCurrentTier = () => {
    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (lifetimeEarned >= TIERS[i].minShards) return i;
    }
    return 0;
  };

  const currentTierIndex = getCurrentTier();
  const currentTier = TIERS[currentTierIndex];
  const nextTier = TIERS[currentTierIndex + 1];
  
  const progressToNextTier = nextTier 
    ? ((lifetimeEarned - currentTier.minShards) / (nextTier.minShards - currentTier.minShards)) * 100
    : 100;

  const shardsToNextTier = nextTier ? nextTier.minShards - lifetimeEarned : 0;

  const TierIcon = currentTier.icon;

  return (
    <motion.div
      className={`p-4 rounded-2xl border ${currentTier.bgColor} ${currentTier.borderColor}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Current Tier Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className={`w-12 h-12 rounded-xl ${currentTier.bgColor} flex items-center justify-center`}
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatDelay: 5
            }}
          >
            <TierIcon className={`w-6 h-6 ${currentTier.color}`} />
          </motion.div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Dit Niveau</p>
            <p className={`font-heading text-xl font-bold ${currentTier.color}`}>
              {currentTier.name}
            </p>
          </div>
        </div>
        
        {nextTier && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Næste: {nextTier.name}</p>
            <p className="text-sm font-semibold text-foreground">
              {shardsToNextTier.toLocaleString('da-DK')} Shards
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {nextTier && (
        <div className="relative h-3 bg-background/50 rounded-full overflow-hidden">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${currentTier.color.replace('text-', 'bg-')}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progressToNextTier, 100)}%` }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          />
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          />
        </div>
      )}

      {/* Tier Icons Preview */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
        {TIERS.map((tier, index) => {
          const Icon = tier.icon;
          const isAchieved = index <= currentTierIndex;
          const isCurrent = index === currentTierIndex;
          
          return (
            <motion.div
              key={tier.name}
              className={`flex flex-col items-center gap-1 ${
                isAchieved ? tier.color : 'text-muted-foreground/30'
              }`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <div className={`relative p-1.5 rounded-lg ${
                isCurrent ? tier.bgColor : 'bg-transparent'
              }`}>
                <Icon className={`w-4 h-4 ${isCurrent ? tier.color : ''}`} />
                {isCurrent && (
                  <motion.div
                    className={`absolute -inset-0.5 rounded-lg border ${tier.borderColor}`}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              <span className="text-[10px] font-medium">{tier.name}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default UserProgressBar;
