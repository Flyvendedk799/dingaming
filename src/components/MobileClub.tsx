import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  Sparkles, Gift, Flame, Gamepad2, LogIn, ArrowRight, 
  Calendar, ShoppingBag, Loader2, ChevronRight, Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useShardBalance, useShardTransactions, useDailyLoginStreak, useClaimDailyShards } from "@/hooks/useShards";

interface MobileClubProps {
  onBack: () => void;
}

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
            <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-success" />
            </div>
            <h2 className="font-heading text-2xl text-foreground mb-2">Bliv medlem</h2>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
              Optjen Shards på alle køb, hent daglige bonusser, og vind præmier!
            </p>

            <div className="space-y-3">
              <Link to="/signup" className="block">
                <Button className="w-full bg-success hover:bg-success/90 text-success-foreground">
                  Opret konto gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">
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
              { icon: ShoppingBag, title: '1% Cashback', desc: 'På alle køb i Shards', color: 'text-primary' },
              { icon: Calendar, title: 'Daglige Bonusser', desc: 'Gratis Shards hver dag', color: 'text-success' },
              { icon: Gamepad2, title: 'Sweepstake Spil', desc: 'Vind flere Shards', color: 'text-accent' },
              { icon: Gift, title: 'Byt til Rewards', desc: 'Vouchers og mere', color: 'text-warning' },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.title}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${benefit.color}`}>
                  <benefit.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.desc}</p>
                </div>
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
            <div>
              <h1 className="font-heading text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-success" />
                Customer Club
              </h1>
              <p className="text-xs text-muted-foreground">
                Hej, {user?.user_metadata?.display_name || user?.email?.split('@')[0]}!
              </p>
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
        {/* Balance Card */}
        <motion.div
          className="p-6 rounded-3xl bg-gradient-to-br from-success/20 to-success/5 border border-success/30 shadow-glow backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-muted-foreground mb-1">Din Balance</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-heading text-4xl text-success">
              {balanceLoading ? '...' : formatShards(balance?.balance || 0)}
            </span>
            <span className="text-lg text-muted-foreground">Shards</span>
          </div>
          <p className="text-xs text-muted-foreground">
            ≈ {((balance?.balance || 0) / 1000).toFixed(2)} DKK værdi
          </p>

          <div className="flex gap-2 mt-4">
            <Link to="/club/rewards" className="flex-1">
              <Button size="sm" className="w-full bg-success hover:bg-success/90 text-success-foreground">
                <Gift className="w-4 h-4 mr-1" />
                Rewards
              </Button>
            </Link>
            <Link to="/club/games" className="flex-1">
              <Button size="sm" variant="outline" className="w-full border-success text-success">
                <Gamepad2 className="w-4 h-4 mr-1" />
                Spil
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Daily Claim */}
        <motion.div
          className="p-4 rounded-xl bg-card border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                {canClaimDaily ? (
                  <Gift className="w-5 h-5 text-success" />
                ) : (
                  <Sparkles className="w-5 h-5 text-success" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">Daglig Bonus</p>
                <p className="text-xs text-muted-foreground">
                  {canClaimDaily ? 'Klar til at hente!' : 'Hentet i dag ✓'}
                </p>
              </div>
            </div>
            {canClaimDaily ? (
              <Button
                size="sm"
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={() => claimDaily.mutate()}
                disabled={claimDaily.isPending}
              >
                {claimDaily.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Hent'
                )}
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 text-accent">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-semibold">{streakCount} dage</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link 
            to="/club/games"
            className="p-4 rounded-xl bg-card border border-border flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-2">
              <Gamepad2 className="w-6 h-6 text-accent" />
            </div>
            <span className="font-medium text-sm">Sweepstake</span>
            <span className="text-xs text-muted-foreground">Mines & Dice</span>
          </Link>
          
          <Link 
            to="/club/rewards"
            className="p-4 rounded-xl bg-card border border-border flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <span className="font-medium text-sm">Rewards</span>
            <span className="text-xs text-muted-foreground">Byt Shards</span>
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
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
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
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Ingen aktivitet endnu</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MobileClub;
