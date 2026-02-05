import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, Gift, Flame, TrendingUp, ArrowRight, 
  Clock, ShoppingBag, Calendar, LogOut, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useShardBalance, useShardTransactions, useDailyLoginStreak, useClaimDailyShards } from '@/hooks/useShards';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ClubPage = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: balance, isLoading: balanceLoading } = useShardBalance();
  const { data: transactions } = useShardTransactions(5);
  const { data: lastLogin } = useDailyLoginStreak();
  const claimDaily = useClaimDailyShards();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  // Check if daily shards can be claimed (no entry today)
  const today = new Date().toISOString().split('T')[0];
  const canClaimDaily = !lastLogin || lastLogin.login_date !== today;
  const streakCount = lastLogin?.streak_count || 0;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const formatShards = (shards: number) => {
    return new Intl.NumberFormat('da-DK').format(shards);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <ShoppingBag className="w-4 h-4" />;
      case 'daily_login': return <Calendar className="w-4 h-4" />;
      case 'redemption': return <Gift className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Welcome Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-heading text-3xl md:text-4xl text-foreground">
              Customer Club
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log ud
            </Button>
          </div>
          <p className="text-muted-foreground">
            Velkommen tilbage, {user.user_metadata?.display_name || user.email?.split('@')[0]}!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Balance Card */}
          <motion.div
            className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-muted-foreground mb-1">Din Shard Balance</p>
                <div className="flex items-baseline gap-3">
                  <span className="font-heading text-5xl md:text-6xl text-primary">
                    {balanceLoading ? '...' : formatShards(balance?.balance || 0)}
                  </span>
                  <span className="text-2xl text-muted-foreground">Shards</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  ≈ {((balance?.balance || 0) / 1000).toFixed(2)} DKK værdi
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link to="/club/rewards">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Gift className="w-5 h-5 mr-2" />
                    Se Rewards
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-border">
              <div>
                <p className="text-muted-foreground text-sm">Optjent i alt</p>
                <p className="font-semibold text-foreground text-lg">
                  {formatShards(balance?.lifetime_earned || 0)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Brugt i alt</p>
                <p className="font-semibold text-foreground text-lg">
                  {formatShards(balance?.lifetime_spent || 0)}
                </p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-muted-foreground text-sm">Login Streak</p>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-accent" />
                  <p className="font-semibold text-foreground text-lg">
                    {streakCount} {streakCount === 1 ? 'dag' : 'dage'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Daily Claim Card */}
          <motion.div
            className="bg-card border border-border rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-success" />
              <h2 className="font-semibold text-foreground">Daglig Bonus</h2>
            </div>

            {canClaimDaily ? (
              <>
                <p className="text-muted-foreground text-sm mb-4">
                  Hent din daglige bonus og hold din streak i gang!
                </p>
                <Button
                  className="w-full bg-success hover:bg-success/90 text-success-foreground"
                  onClick={() => claimDaily.mutate()}
                  disabled={claimDaily.isPending}
                >
                  {claimDaily.isPending ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-success-foreground/30 border-t-success-foreground rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <>
                      <Gift className="w-5 h-5 mr-2" />
                      Hent Bonus
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-success" />
                </div>
                <p className="text-success font-semibold">Bonus hentet i dag!</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Kom igen i morgen
                </p>
              </div>
            )}

            {/* Streak info */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Streak bonusser:</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Dag 1-6</span>
                  <span>50-175 Shards</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Dag 7+</span>
                  <span className="text-success">200+ Shards</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div
          className="mt-6 bg-card border border-border rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Seneste Aktivitet
            </h2>
            <Link 
              to="/club/history" 
              className="text-sm text-primary hover:underline"
            >
              Se alle
            </Link>
          </div>

          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.amount > 0 ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
                    }`}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-medium">{tx.description}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(tx.created_at).toLocaleDateString('da-DK', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${
                    tx.amount > 0 ? 'text-success' : 'text-accent'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{formatShards(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Ingen aktivitet endnu</p>
              <p className="text-muted-foreground text-sm">
                Køb spil eller hent din daglige bonus for at optjene Shards!
              </p>
            </div>
          )}
        </motion.div>

        {/* How to Earn */}
        <motion.div
          className="mt-6 bg-card border border-border rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-semibold text-foreground mb-4">Sådan optjener du Shards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-background rounded-xl border border-border">
              <ShoppingBag className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-medium text-foreground mb-1">Køb Spil</h3>
              <p className="text-sm text-muted-foreground">
                Optjen 1% af dit køb i Shards. 100 DKK = 1.000 Shards!
              </p>
            </div>
            <div className="p-4 bg-background rounded-xl border border-border">
              <Calendar className="w-8 h-8 text-success mb-3" />
              <h3 className="font-medium text-foreground mb-1">Daglig Login</h3>
              <p className="text-sm text-muted-foreground">
                Hent bonus hver dag. Streaks giver endnu flere Shards!
              </p>
            </div>
            <div className="p-4 bg-background rounded-xl border border-border">
              <Sparkles className="w-8 h-8 text-accent mb-3" />
              <h3 className="font-medium text-foreground mb-1">Kommer Snart</h3>
              <p className="text-sm text-muted-foreground">
                Sociale medier, anmeldelser, og meget mere!
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default ClubPage;
