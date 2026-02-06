import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  Sparkles, Gift, Flame, Gamepad2, LogIn, ArrowRight, 
  Calendar, ShoppingBag, Loader2, ChevronRight, Trophy, Package,
  Crown, Star, Zap, Target, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useShardBalance, useShardTransactions, useDailyLoginStreak, useClaimDailyShards } from "@/hooks/useShards";

interface MobileClubProps {
  onBack: () => void;
}

// Tier system
const TIERS = [
  { name: "Bronze", minShards: 0, icon: Star, color: "text-amber-600" },
  { name: "Sølv", minShards: 10000, icon: Crown, color: "text-slate-400" },
  { name: "Guld", minShards: 50000, icon: Crown, color: "text-primary" },
  { name: "Platinum", minShards: 100000, icon: Trophy, color: "text-cyan-400" },
  { name: "Diamond", minShards: 250000, icon: Sparkles, color: "text-violet-400" },
];

const MobileClub = ({ onBack }: MobileClubProps) => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: balance, isLoading: balanceLoading } = useShardBalance();
  const { data: transactions } = useShardTransactions(5);
  const { data: lastLogin } = useDailyLoginStreak();
  const claimDaily = useClaimDailyShards();

  const today = new Date().toISOString().split('T')[0];
  const canClaimDaily = user && (!lastLogin || lastLogin.login_date !== today);
  const streakCount = lastLogin?.streak_count || 0;

  const getCurrentTier = () => {
    const earned = balance?.lifetime_earned || 0;
    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (earned >= TIERS[i].minShards) return TIERS[i];
    }
    return TIERS[0];
  };

  const currentTier = getCurrentTier();
  const TierIcon = currentTier.icon;

  const formatShards = (shards: number) => {
    return new Intl.NumberFormat('da-DK').format(shards);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <ShoppingBag className="w-4 h-4" />;
      case 'daily_login': return <Calendar className="w-4 h-4" />;
      case 'redemption': return <Gift className="w-4 h-4" />;
      case 'game_win': return <Trophy className="w-4 h-4" />;
      case 'game_bet': return <Gamepad2 className="w-4 h-4" />;
      case 'case_opening': return <Package className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  // Not logged in view
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div 
          className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="px-4 py-3">
            <h1 className="font-heading text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-success" />
              Customer Club
            </h1>
          </div>
        </div>

        <div className="px-4 py-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Animated sparkles icon */}
            <motion.div 
              className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center mb-6 border border-success/30"
              animate={{ 
                boxShadow: ["0 0 0 0 hsl(var(--success) / 0)", "0 0 30px 10px hsl(var(--success) / 0.2)", "0 0 0 0 hsl(var(--success) / 0)"]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Sparkles className="w-12 h-12 text-success" />
              </motion.div>
            </motion.div>
            
            <h2 className="font-heading text-2xl text-foreground mb-2">Bliv medlem</h2>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
              Optjen Shards på alle køb, hent daglige bonusser, og vind præmier!
            </p>

            <div className="space-y-3">
              <Link to="/signup" className="block">
                <Button className="w-full bg-success hover:bg-success/90 text-success-foreground h-12">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Opret konto gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full h-12">
                  <LogIn className="w-4 h-4 mr-2" />
                  Log ind
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div
            className="mt-8 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-semibold text-foreground mb-4">Fordele</h3>
            
            {[
              { icon: ShoppingBag, title: '1% Cashback', desc: 'På alle køb i Shards', color: 'text-primary', bgColor: 'bg-primary/10' },
              { icon: Calendar, title: 'Daglige Bonusser', desc: 'Gratis Shards hver dag', color: 'text-success', bgColor: 'bg-success/10' },
              { icon: Gamepad2, title: 'Sweepstake Spil', desc: 'Vind flere Shards', color: 'text-accent', bgColor: 'bg-accent/10' },
              { icon: Package, title: 'Åbn Cases', desc: 'Vind spil med Shards', color: 'text-violet-400', bgColor: 'bg-violet-400/10' },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.title}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-border/80 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div className={`w-12 h-12 rounded-xl ${benefit.bgColor} flex items-center justify-center ${benefit.color}`}>
                  <benefit.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  // Loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Week rewards for streak display
  const WEEK_REWARDS = [50, 75, 100, 125, 150, 175, 300];
  const dayInCycle = streakCount === 0 ? 0 : ((streakCount - 1) % 7) + 1;

  // Logged in view
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div 
        className="sticky top-0 z-40 bg-background/60 backdrop-blur-2xl border-b border-border/30"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-success/20 to-primary/10 flex items-center justify-center`}>
                <TierIcon className={`w-5 h-5 ${currentTier.color}`} />
              </div>
              <div>
                <h1 className="font-heading text-lg font-bold flex items-center gap-2">
                  {user?.user_metadata?.display_name || user?.email?.split('@')[0]}
                  <span className={`text-xs px-1.5 py-0.5 rounded ${currentTier.color} bg-success/10`}>
                    {currentTier.name}
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Customer Club Member
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => signOut()}
              className="text-muted-foreground"
            >
              Log ud
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Enhanced Balance Card */}
        <motion.div
          className="relative p-6 rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-success/25 via-success/10 to-primary/15" />
          <motion.div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-success/20 blur-3xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          
          <div className="relative border border-success/30 rounded-2xl backdrop-blur-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Din Balance</span>
            </div>
            
            <div className="flex items-baseline gap-2 mb-3">
              <motion.span 
                className="font-heading text-4xl text-success"
                key={balance?.balance}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                {balanceLoading ? '...' : formatShards(balance?.balance || 0)}
              </motion.span>
              <span className="text-lg text-muted-foreground">Shards</span>
            </div>
            
            <p className="text-xs text-muted-foreground mb-4">
              ≈ {((balance?.balance || 0) / 1000).toFixed(2)} DKK værdi
            </p>

            <div className="grid grid-cols-3 gap-2">
              <Link to="/club/rewards">
                <Button size="sm" className="w-full bg-success hover:bg-success/90 text-success-foreground">
                  <Gift className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/club/casino">
                <Button size="sm" variant="outline" className="w-full border-accent text-accent hover:bg-accent/10">
                  <Gamepad2 className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/club/cases">
                <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                  <Package className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Streak Week View */}
        <motion.div
          className="p-4 rounded-2xl bg-card border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-accent" />
              <span className="font-semibold text-foreground">Login Streak</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent">
              <Flame className="w-3.5 h-3.5" />
              <span className="text-sm font-bold">{streakCount}</span>
            </div>
          </div>

          {/* Week progress */}
          <div className="grid grid-cols-7 gap-1.5">
            {WEEK_REWARDS.map((reward, index) => {
              const dayNum = index + 1;
              const isCompleted = dayNum <= dayInCycle && !canClaimDaily || (dayNum < dayInCycle && canClaimDaily);
              const isToday = canClaimDaily && dayNum === (dayInCycle === 0 ? 1 : dayInCycle + 1);
              
              return (
                <motion.button
                  key={dayNum}
                  className={`relative flex flex-col items-center p-2 rounded-xl transition-all ${
                    isCompleted 
                      ? 'bg-success/20 border border-success/40' 
                      : isToday
                        ? 'bg-primary/20 border-2 border-primary'
                        : 'bg-muted/50 border border-border/50'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + index * 0.03 }}
                  onClick={isToday ? () => claimDaily.mutate() : undefined}
                  whileTap={isToday ? { scale: 0.95 } : {}}
                  disabled={claimDaily.isPending}
                >
                  <span className={`text-[10px] font-medium ${
                    isCompleted ? 'text-success' : isToday ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {dayNum}
                  </span>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center my-0.5 ${
                    isCompleted ? 'bg-success/30' : isToday ? 'bg-primary/30' : 'bg-muted'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : isToday && claimDaily.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    ) : (
                      <Gift className={`w-3 h-3 ${dayNum === 7 ? 'text-accent' : 'text-muted-foreground/50'}`} />
                    )}
                  </div>
                  <span className={`text-[8px] ${dayNum === 7 ? 'text-accent font-bold' : 'text-muted-foreground'}`}>
                    +{reward}
                  </span>
                  {dayNum === 7 && (
                    <div className="absolute -top-1 -right-1 px-1 py-0.5 rounded text-[6px] font-bold bg-accent text-accent-foreground">
                      2X
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {canClaimDaily && (
            <motion.p
              className="text-xs text-center text-primary mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Tryk på dag {(dayInCycle % 7) + 1} for at hente bonus!
            </motion.p>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link 
            to="/club/casino"
            className="p-4 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-3">
              <Gamepad2 className="w-6 h-6 text-accent" />
            </div>
            <span className="font-semibold text-foreground">Casino</span>
            <span className="text-xs text-muted-foreground">Mines & Dice</span>
            <div className="mt-2 flex items-center text-accent text-xs font-medium">
              Spil nu <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/club/cases"
            className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <span className="font-semibold text-foreground">Cases</span>
            <span className="text-xs text-muted-foreground">Åben loot</span>
            <div className="mt-2 flex items-center text-primary text-xs font-medium">
              Se cases <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Seneste Aktivitet</h2>
            <button className="text-sm text-success flex items-center">
              Se alle <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      tx.amount > 0 ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
                    }`}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('da-DK', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${
                    tx.amount > 0 ? 'text-success' : 'text-accent'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{formatShards(tx.amount)}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 rounded-xl bg-card border border-border">
              <Sparkles className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Ingen aktivitet endnu</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MobileClub;
