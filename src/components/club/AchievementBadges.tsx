import { motion } from "framer-motion";
import { 
  Trophy, Star, Flame, ShoppingBag, Gift, Gamepad2, 
  Target, Zap, Crown, Award, Medal, Sparkles 
} from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: typeof Trophy;
  color: string;
  bgColor: string;
  requirement: number;
  current: number;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementBadgesProps {
  lifetimeEarned: number;
  lifetimeSpent: number;
  totalPurchases: number;
  currentStreak: number;
  casesOpened?: number;
  gamesPlayed?: number;
}

const ACHIEVEMENTS: Omit<Achievement, 'current' | 'unlocked'>[] = [
  {
    id: 'first_purchase',
    name: 'Første Køb',
    description: 'Gennemfør dit første køb',
    icon: ShoppingBag,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/20',
    requirement: 1,
    rarity: 'common',
  },
  {
    id: 'loyal_customer',
    name: 'Loyal Kunde',
    description: 'Gennemfør 5 køb',
    icon: Star,
    color: 'text-primary',
    bgColor: 'bg-primary/20',
    requirement: 5,
    rarity: 'common',
  },
  {
    id: 'streak_7',
    name: 'Ugens Warrior',
    description: '7-dages login streak',
    icon: Flame,
    color: 'text-club',
    bgColor: 'bg-club/20',
    requirement: 7,
    rarity: 'rare',
  },
  {
    id: 'streak_30',
    name: 'Månedens Mester',
    description: '30-dages login streak',
    icon: Crown,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/20',
    requirement: 30,
    rarity: 'epic',
  },
  {
    id: 'high_roller',
    name: 'High Roller',
    description: 'Optjen 50.000 Shards',
    icon: Trophy,
    color: 'text-violet-400',
    bgColor: 'bg-violet-400/20',
    requirement: 50000,
    rarity: 'rare',
  },
  {
    id: 'shard_master',
    name: 'Shard Master',
    description: 'Optjen 250.000 Shards',
    icon: Sparkles,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/20',
    requirement: 250000,
    rarity: 'legendary',
  },
  {
    id: 'first_reward',
    name: 'Smart Shopper',
    description: 'Indløs din første reward',
    icon: Gift,
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/20',
    requirement: 1,
    rarity: 'common',
  },
  {
    id: 'case_opener',
    name: 'Loot Hunter',
    description: 'Åbn 10 cases',
    icon: Target,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/20',
    requirement: 10,
    rarity: 'rare',
  },
];

const RARITY_COLORS = {
  common: 'from-slate-400/20 to-slate-600/20 border-slate-500/30',
  rare: 'from-blue-400/20 to-blue-600/20 border-blue-500/30',
  epic: 'from-purple-400/20 to-purple-600/20 border-purple-500/30',
  legendary: 'from-amber-400/20 to-orange-500/20 border-amber-500/30',
};

const RARITY_GLOW = {
  common: '',
  rare: 'shadow-[0_0_15px_hsl(217_91%_60%/0.2)]',
  epic: 'shadow-[0_0_20px_hsl(270_95%_60%/0.25)]',
  legendary: 'shadow-[0_0_25px_hsl(38_92%_50%/0.3)]',
};

const AchievementBadges = ({ 
  lifetimeEarned, 
  lifetimeSpent, 
  totalPurchases, 
  currentStreak,
  casesOpened = 0,
  gamesPlayed = 0
}: AchievementBadgesProps) => {
  
  const getAchievementProgress = (id: string): { current: number; unlocked: boolean } => {
    switch (id) {
      case 'first_purchase':
      case 'loyal_customer':
        return { current: totalPurchases, unlocked: totalPurchases >= ACHIEVEMENTS.find(a => a.id === id)!.requirement };
      case 'streak_7':
      case 'streak_30':
        return { current: currentStreak, unlocked: currentStreak >= ACHIEVEMENTS.find(a => a.id === id)!.requirement };
      case 'high_roller':
      case 'shard_master':
        return { current: lifetimeEarned, unlocked: lifetimeEarned >= ACHIEVEMENTS.find(a => a.id === id)!.requirement };
      case 'first_reward':
        return { current: lifetimeSpent > 0 ? 1 : 0, unlocked: lifetimeSpent > 0 };
      case 'case_opener':
        return { current: casesOpened, unlocked: casesOpened >= 10 };
      default:
        return { current: 0, unlocked: false };
    }
  };

  const achievements = ACHIEVEMENTS.map(a => ({
    ...a,
    ...getAchievementProgress(a.id),
  }));

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <motion.div
      className="bg-card border border-border rounded-2xl p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Award className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Achievements</h3>
            <p className="text-xs text-muted-foreground">
              {unlockedCount} af {achievements.length} låst op
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {[...Array(Math.min(unlockedCount, 5))].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-club"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            />
          ))}
          {unlockedCount > 5 && (
            <span className="text-xs text-club font-medium ml-1">+{unlockedCount - 5}</span>
          )}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-4 gap-3">
        {achievements.map((achievement, index) => {
          const Icon = achievement.icon;
          const progress = Math.min((achievement.current / achievement.requirement) * 100, 100);
          
          return (
            <motion.div
              key={achievement.id}
              className={`relative group cursor-pointer`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className={`
                relative aspect-square rounded-xl border overflow-hidden
                bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]}
                ${achievement.unlocked ? RARITY_GLOW[achievement.rarity] : 'opacity-50 grayscale'}
                transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0
              `}>
                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className={`w-6 h-6 ${achievement.color}`} />
                </div>

                {/* Progress ring for locked achievements */}
                {!achievement.unlocked && (
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="40%"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-muted"
                    />
                    <motion.circle
                      cx="50%"
                      cy="50%"
                      r="40%"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={`${progress * 2.51} 251`}
                      className="text-muted-foreground"
                      initial={{ strokeDasharray: "0 251" }}
                      animate={{ strokeDasharray: `${progress * 2.51} 251` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.05 }}
                    />
                  </svg>
                )}

                {/* Unlocked checkmark */}
                {achievement.unlocked && (
                  <motion.div
                    className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-club flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.5 + index * 0.05 }}
                  >
                    <Medal className="w-2.5 h-2.5 text-club-foreground" />
                  </motion.div>
                )}
              </div>

              {/* Tooltip on hover */}
              <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-popover border border-border shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                <p className="text-sm font-medium text-foreground">{achievement.name}</p>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
                {!achievement.unlocked && (
                  <p className="text-xs text-primary mt-1">
                    {achievement.current.toLocaleString('da-DK')} / {achievement.requirement.toLocaleString('da-DK')}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default AchievementBadges;
