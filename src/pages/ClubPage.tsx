import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, ShoppingBag, LogOut, Sparkles, TrendingUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useShardBalance, useShardTransactions, useDailyLoginStreak, useClaimDailyShards } from '@/hooks/useShards';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import UserProgressBar from '@/components/club/UserProgressBar';
import StreakCalendar from '@/components/club/StreakCalendar';
import LiveActivityFeed from '@/components/club/LiveActivityFeed';
import AchievementBadges from '@/components/club/AchievementBadges';
import EnhancedBalanceCard from '@/components/club/EnhancedBalanceCard';
import BuyShardsSection from '@/components/club/BuyShardsSection';

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
            <div>
              <h1 className="font-heading text-3xl md:text-4xl text-foreground">
                Customer Club
              </h1>
              <p className="text-muted-foreground">
                Velkommen tilbage, {user.user_metadata?.display_name || user.email?.split('@')[0]}!
              </p>
            </div>
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
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Balance & Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Balance Card */}
            <EnhancedBalanceCard
              balance={balance?.balance || 0}
              lifetimeEarned={balance?.lifetime_earned || 0}
              lifetimeSpent={balance?.lifetime_spent || 0}
              isLoading={balanceLoading}
            />

            {/* Buy Shards Section */}
            <BuyShardsSection />

            {/* Progress Tier */}
            <UserProgressBar
              currentShards={balance?.balance || 0}
              lifetimeEarned={balance?.lifetime_earned || 0}
            />

            {/* Achievements */}
            <AchievementBadges
              lifetimeEarned={balance?.lifetime_earned || 0}
              lifetimeSpent={balance?.lifetime_spent || 0}
              totalPurchases={0}
              currentStreak={streakCount}
            />

            {/* Recent Transactions */}
            <motion.div
              className="bg-card border border-border rounded-2xl p-6"
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
                  {transactions.map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
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
                    </motion.div>
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
          </div>

          {/* Right Column - Streak & Activity */}
          <div className="space-y-6">
            {/* Streak Calendar */}
            <StreakCalendar
              currentStreak={streakCount}
              canClaimToday={canClaimDaily}
              onClaim={() => claimDaily.mutate()}
              isPending={claimDaily.isPending}
            />

            {/* Live Activity Feed */}
            <LiveActivityFeed maxItems={6} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ClubPage;
