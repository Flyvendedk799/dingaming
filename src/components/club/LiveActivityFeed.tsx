import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ShoppingBag, Gift, Gamepad2, Package, Trophy, Sparkles, Zap } from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'purchase' | 'case_win' | 'game_win' | 'reward' | 'achievement';
  user: string;
  message: string;
  value?: string;
  timestamp: Date;
}

// Mock data generator for live feed effect
const generateMockActivity = (): ActivityItem => {
  const types: ActivityItem['type'][] = ['purchase', 'case_win', 'game_win', 'reward', 'achievement'];
  const usernames = ['Gamer***', 'Ninja***', 'Dark***', 'Pro***', 'Elite***', 'Shadow***', 'Cyber***'];
  const games = ['GTA V', 'Elden Ring', 'FIFA 24', 'Minecraft', 'Hogwarts Legacy', 'CS2'];
  
  const type = types[Math.floor(Math.random() * types.length)];
  const user = usernames[Math.floor(Math.random() * usernames.length)];
  
  let message = '';
  let value = '';
  
  switch (type) {
    case 'purchase':
      message = `købte ${games[Math.floor(Math.random() * games.length)]}`;
      value = `+${(Math.floor(Math.random() * 5) + 1) * 100} Shards`;
      break;
    case 'case_win':
      message = `vandt ${games[Math.floor(Math.random() * games.length)]} fra case!`;
      value = `${(Math.floor(Math.random() * 200) + 50)} DKK`;
      break;
    case 'game_win':
      message = `vandt i Mines`;
      value = `+${(Math.floor(Math.random() * 5000) + 500)} Shards`;
      break;
    case 'reward':
      message = `indløste voucher`;
      value = `${(Math.floor(Math.random() * 50) + 10)} DKK`;
      break;
    case 'achievement':
      message = `opnåede 7-dages streak!`;
      value = '+300 Shards';
      break;
  }
  
  return {
    id: Math.random().toString(36).slice(2),
    type,
    user,
    message,
    value,
    timestamp: new Date(),
  };
};

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'purchase': return ShoppingBag;
    case 'case_win': return Package;
    case 'game_win': return Gamepad2;
    case 'reward': return Gift;
    case 'achievement': return Trophy;
    default: return Sparkles;
  }
};

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'purchase': return 'text-primary bg-primary/20';
    case 'case_win': return 'text-accent bg-accent/20';
    case 'game_win': return 'text-success bg-success/20';
    case 'reward': return 'text-violet-400 bg-violet-400/20';
    case 'achievement': return 'text-amber-400 bg-amber-400/20';
    default: return 'text-muted-foreground bg-muted';
  }
};

interface LiveActivityFeedProps {
  maxItems?: number;
  className?: string;
}

const LiveActivityFeed = ({ maxItems = 5, className = "" }: LiveActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Initial items
    const initial = Array.from({ length: 3 }, generateMockActivity);
    setActivities(initial);

    // Add new activity every 5-10 seconds
    const interval = setInterval(() => {
      if (!isLive) return;
      
      setActivities(prev => {
        const newActivity = generateMockActivity();
        const updated = [newActivity, ...prev];
        return updated.slice(0, maxItems);
      });
    }, 5000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [isLive, maxItems]);

  return (
    <motion.div
      className={`bg-card border border-border rounded-2xl overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-success"
            animate={{ opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <h3 className="font-semibold text-foreground">Live Aktivitet</h3>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            isLive 
              ? 'bg-success/10 text-success hover:bg-success/20' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Zap className="w-3 h-3" />
          {isLive ? 'Live' : 'Paused'}
        </button>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-border/30">
        <AnimatePresence mode="popLayout" initial={false}>
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClasses = getActivityColor(activity.type);
            
            return (
              <motion.div
                key={activity.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.3 }}
                layout
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    <span className="font-medium">{activity.user}</span>
                    {' '}{activity.message}
                  </p>
                  {activity.value && (
                    <p className={`text-xs font-semibold ${
                      activity.type === 'case_win' || activity.type === 'game_win' 
                        ? 'text-success' 
                        : 'text-muted-foreground'
                    }`}>
                      {activity.value}
                    </p>
                  )}
                </div>

                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {index === 0 ? 'Nu' : `${index * 2 + 1}m`}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-muted/30 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✨ {Math.floor(Math.random() * 50 + 150)} aktive brugere lige nu
          </motion.span>
        </p>
      </div>
    </motion.div>
  );
};

export default LiveActivityFeed;
