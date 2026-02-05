import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useShardBalance } from '@/hooks/useShards';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MinesGame from '@/components/games/MinesGame';
import DiceGame from '@/components/games/DiceGame';

const GamesPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: balance } = useShardBalance();

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

  const formatShards = (shards: number) => {
    return new Intl.NumberFormat('da-DK').format(shards);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link 
            to="/club"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage til Club
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl text-foreground flex items-center gap-3">
                <Zap className="w-8 h-8 text-primary" />
                Sweepstake Spil
              </h1>
              <p className="text-muted-foreground mt-1">
                Brug dine Shards og vind endnu flere!
              </p>
            </div>
            
            <div className="bg-card border border-border rounded-xl px-6 py-3">
              <p className="text-sm text-muted-foreground">Din Balance</p>
              <p className="font-heading text-2xl text-primary">
                {formatShards(balance?.balance || 0)} <span className="text-base text-muted-foreground">Shards</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium">Spil ansvarligt</p>
            <p className="text-xs text-muted-foreground mt-1">
              Dette er underholdning med virtuelle points. Sæt grænser for dig selv og spil kun for sjov.
            </p>
          </div>
        </motion.div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <MinesGame />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <DiceGame />
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-card border border-border rounded-2xl p-6"
        >
          <h2 className="font-semibold text-foreground mb-4">Brug for flere Shards?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/club">
              <Button variant="outline" className="w-full">
                Hent daglig bonus
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full">
                Køb spil (1% cashback)
              </Button>
            </Link>
            <Link to="/club/rewards">
              <Button variant="outline" className="w-full">
                Brug Shards på rewards
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default GamesPage;
