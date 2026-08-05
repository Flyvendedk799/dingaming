import { motion } from "framer-motion";
import { Flame, Check, Gift } from "lucide-react";

interface StreakCalendarProps {
  currentStreak: number;
  canClaimToday: boolean;
  onClaim?: () => void;
  isPending?: boolean;
}

const WEEK_REWARDS = [
  { day: 1, shards: 50 },
  { day: 2, shards: 75 },
  { day: 3, shards: 100 },
  { day: 4, shards: 125 },
  { day: 5, shards: 150 },
  { day: 6, shards: 175 },
  { day: 7, shards: 300, bonus: true },
];

const StreakCalendar = ({ currentStreak, canClaimToday, onClaim, isPending }: StreakCalendarProps) => {
  // Calculate which day in the current week cycle (1-7)
  const dayInCycle = currentStreak === 0 ? 0 : ((currentStreak - 1) % 7) + 1;
  const todayIndex = canClaimToday ? dayInCycle : dayInCycle;

  return (
    <motion.div
      className="bg-card border border-border rounded-2xl p-5 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      {/* Header with flame animation */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <motion.div
            className="relative"
            animate={{ 
              scale: currentStreak > 0 ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <div className="w-10 h-10 rounded-xl bg-club/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-club" />
            </div>
            {currentStreak >= 7 && (
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-club flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Check className="w-2.5 h-2.5 text-club-foreground" />
              </motion.div>
            )}
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground">Login Streak</h3>
            <p className="text-xs text-muted-foreground">
              {currentStreak > 0 
                ? `${currentStreak} ${currentStreak === 1 ? 'dag' : 'dage'} i træk!`
                : 'Start din streak i dag!'
              }
            </p>
          </div>
        </div>
        
        <motion.div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-club/10 text-club"
          animate={currentStreak >= 7 ? { 
            boxShadow: ["0 0 0 0 hsl(var(--accent) / 0)", "0 0 0 8px hsl(var(--accent) / 0)"]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Flame className="w-4 h-4" />
          <span className="font-bold">{currentStreak}</span>
        </motion.div>
      </div>

      {/* Week Progress */}
      <div className="grid grid-cols-7 gap-2">
        {WEEK_REWARDS.map((reward, index) => {
          const dayNum = index + 1;
          const isCompleted = dayNum <= dayInCycle && !canClaimToday || (dayNum < dayInCycle && canClaimToday);
          const isToday = canClaimToday && dayNum === (dayInCycle === 0 ? 1 : dayInCycle + 1);
          const isFuture = dayNum > (canClaimToday ? dayInCycle + 1 : dayInCycle);
          
          return (
            <motion.div
              key={dayNum}
              className={`relative flex flex-col items-center p-2 rounded-xl transition-all ${
                isCompleted 
                  ? 'bg-club/20 border border-club/40' 
                  : isToday
                    ? 'bg-primary/20 border-2 border-primary cursor-pointer hover:bg-primary/30'
                    : 'bg-muted/50 border border-border/50'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              onClick={isToday && onClaim ? onClaim : undefined}
              whileHover={isToday ? { scale: 1.05 } : {}}
              whileTap={isToday ? { scale: 0.95 } : {}}
            >
              {/* Day number */}
              <span className={`text-xs font-semibold mb-1 ${
                isCompleted ? 'text-club' : isToday ? 'text-primary' : 'text-muted-foreground'
              }`}>
                Dag {dayNum}
              </span>

              {/* Icon or checkmark */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${
                isCompleted 
                  ? 'bg-club/30' 
                  : isToday 
                    ? 'bg-primary/30'
                    : 'bg-muted'
              }`}>
                {isCompleted ? (
                  <Check className="w-4 h-4 text-club" />
                ) : isToday ? (
                  isPending ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <Gift className="w-4 h-4 text-primary" />
                  )
                ) : (
                  <Gift className={`w-4 h-4 ${reward.bonus ? 'text-club' : 'text-muted-foreground/50'}`} />
                )}
              </div>

              {/* Shards reward */}
              <span className={`text-[10px] font-medium ${
                reward.bonus ? 'text-club' : isCompleted ? 'text-club' : 'text-muted-foreground'
              }`}>
                +{reward.shards}
              </span>

              {/* Bonus indicator */}
              {reward.bonus && (
                <motion.div
                  className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-club text-club-foreground"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                >
                  2X
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Today's prompt */}
      {canClaimToday && (
        <motion.div
          className="mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-club/10 border border-primary/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-center text-foreground">
            🎁 Tryk på <span className="font-semibold text-primary">Dag {(dayInCycle % 7) + 1}</span> for at hente din bonus!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default StreakCalendar;
