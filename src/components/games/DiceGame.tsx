import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Loader2, Zap, ArrowUp, ArrowDown, Trophy, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useShardBalance } from '@/hooks/useShards';
import { usePlayDice, calculateDiceMultiplier } from '@/hooks/useGames';
import { cn } from '@/lib/utils';

const DiceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

interface RollHistoryItem {
  roll: number;
  isWin: boolean;
  timestamp: number;
}

const DiceGame = () => {
  const { data: balance } = useShardBalance();
  const playDice = usePlayDice();

  const [betAmount, setBetAmount] = useState(100);
  const [targetNumber, setTargetNumber] = useState(50);
  const [isOver, setIsOver] = useState(true);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<{ isWin: boolean; winAmount: number } | null>(null);
  const [displayRoll, setDisplayRoll] = useState<number>(50);
  const [rollHistory, setRollHistory] = useState<RollHistoryItem[]>([]);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [streak, setStreak] = useState(0);
  
  const diceControls = useAnimation();
  const resultControls = useAnimation();
  const rollInterval = useRef<NodeJS.Timeout | null>(null);

  const winChance = isOver ? (99 - targetNumber) : (targetNumber - 1);
  const multiplier = calculateDiceMultiplier(winChance);
  const potentialWin = Math.floor(betAmount * multiplier);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (rollInterval.current) clearInterval(rollInterval.current);
    };
  }, []);

  // Celebration effect
  useEffect(() => {
    if (lastResult?.isWin) {
      setShowWinCelebration(true);
      const timer = setTimeout(() => setShowWinCelebration(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastResult]);

  const handlePlay = async () => {
    if (betAmount < 10 || betAmount > (balance?.balance || 0)) return;
    
    setIsRolling(true);
    setLastResult(null);
    
    // Start dramatic rolling animation
    diceControls.start({
      rotate: [0, 360, 720, 1080],
      scale: [1, 1.1, 0.9, 1.05, 1],
      transition: { duration: 1.2, ease: "easeInOut" }
    });
    
    // Animate random numbers with increasing speed then slowing down
    let speed = 30;
    const accelerate = () => {
      setDisplayRoll(Math.floor(Math.random() * 100) + 1);
    };
    
    rollInterval.current = setInterval(accelerate, speed);

    try {
      const result = await playDice.mutateAsync({ betAmount, targetNumber, isOver });
      
      // Slow down animation towards final result
      setTimeout(() => {
        if (rollInterval.current) clearInterval(rollInterval.current);
        
        // Final approach animation
        const finalApproach = async () => {
          const steps = 8;
          const finalRoll = result.roll;
          
          for (let i = 0; i < steps; i++) {
            await new Promise(r => setTimeout(r, 80 + i * 40));
            // Gradually approach the final number
            const progress = (i + 1) / steps;
            const randomness = 1 - progress;
            const approachValue = Math.round(
              finalRoll + (Math.random() - 0.5) * 50 * randomness
            );
            setDisplayRoll(Math.max(1, Math.min(100, approachValue)));
          }
          
          // Final reveal
          await new Promise(r => setTimeout(r, 100));
          setDisplayRoll(finalRoll);
          setLastRoll(finalRoll);
          
          // Dramatic result animation
          resultControls.start({
            scale: [1, 1.3, 1],
            transition: { duration: 0.4, ease: "easeOut" }
          });
          
          setLastResult({ isWin: result.isWin, winAmount: result.winAmount });
          setIsRolling(false);
          
          // Update history
          setRollHistory(prev => [
            { roll: finalRoll, isWin: result.isWin, timestamp: Date.now() },
            ...prev.slice(0, 9)
          ]);
          
          // Update streak
          if (result.isWin) {
            setStreak(prev => prev + 1);
          } else {
            setStreak(0);
          }
        };
        
        finalApproach();
      }, 800);
    } catch (e) {
      if (rollInterval.current) clearInterval(rollInterval.current);
      setIsRolling(false);
    }
  };

  const formatShards = (shards: number) => {
    return new Intl.NumberFormat('da-DK').format(shards);
  };

  const quickBets = [100, 500, 1000, 5000];

  // Get a dice icon based on the roll (map 1-100 to 6 dice faces)
  const getDiceIconComponent = (roll: number) => {
    const index = Math.floor((roll - 1) / 100 * 6);
    return DiceIcons[Math.min(index, 5)];
  };

  const DiceIcon = getDiceIconComponent(displayRoll);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 relative overflow-hidden">
      {/* Win celebration particles */}
      <AnimatePresence>
        {showWinCelebration && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ 
                  x: '50%', 
                  y: '30%',
                  scale: 0,
                  opacity: 1 
                }}
                animate={{ 
                  x: `${20 + Math.random() * 60}%`,
                  y: `${Math.random() * 80}%`,
                  scale: [0, 1.2, 0.8],
                  opacity: [1, 1, 0],
                  rotate: Math.random() * 360
                }}
                transition={{ 
                  duration: 1.2,
                  delay: Math.random() * 0.2,
                  ease: "easeOut"
                }}
              >
                <Sparkles className="w-4 h-4 text-success" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"
            whileHover={{ scale: 1.05, rotate: 15 }}
          >
            <Dice6 className="w-5 h-5 text-accent" />
          </motion.div>
          <div>
            <h2 className="font-heading text-xl text-foreground">Dice</h2>
            <p className="text-sm text-muted-foreground">Forudsig om terningen ruller over eller under!</p>
          </div>
        </div>
        
        {/* Win streak indicator */}
        <AnimatePresence>
          {streak > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: 20 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30"
            >
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm font-bold text-success">{streak}x</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Controls */}
        <div className="space-y-4">
          {/* Bet Amount */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Indsats
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                onBlur={() => setBetAmount(prev => Math.max(10, prev))}
                disabled={isRolling}
                className="bg-background"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBetAmount(Math.floor(betAmount / 2))}
                disabled={isRolling || betAmount < 20}
              >
                ½
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBetAmount(Math.min(betAmount * 2, balance?.balance || 0))}
                disabled={isRolling}
              >
                2×
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              {quickBets.map((qb) => (
                <motion.div key={qb} className="flex-1" whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setBetAmount(qb)}
                    disabled={isRolling || qb > (balance?.balance || 0)}
                  >
                    {qb}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Over/Under Toggle */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Forudsigelse
            </label>
            <div className="grid grid-cols-2 gap-2">
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  variant={isOver ? "default" : "outline"}
                  onClick={() => setIsOver(true)}
                  disabled={isRolling}
                  className={cn(
                    "w-full h-12 transition-all duration-300",
                    isOver && "bg-success hover:bg-success/90 text-success-foreground shadow-lg shadow-success/20"
                  )}
                >
                  <ArrowUp className="w-5 h-5 mr-2" />
                  Over {targetNumber}
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  variant={!isOver ? "default" : "outline"}
                  onClick={() => setIsOver(false)}
                  disabled={isRolling}
                  className={cn(
                    "w-full h-12 transition-all duration-300",
                    !isOver && "bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20"
                  )}
                >
                  <ArrowDown className="w-5 h-5 mr-2" />
                  Under {targetNumber}
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Target Number Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-muted-foreground">
                Måltal
              </label>
              <motion.span 
                key={targetNumber}
                initial={{ scale: 1.2, color: 'hsl(var(--primary))' }}
                animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
                className="text-sm font-medium"
              >
                {targetNumber}
              </motion.span>
            </div>
            <Slider
              value={[targetNumber]}
              onValueChange={([value]) => setTargetNumber(value)}
              min={2}
              max={98}
              step={1}
              disabled={isRolling}
              className="my-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>2</span>
              <span>50</span>
              <span>98</span>
            </div>
          </div>

          {/* Stats */}
          <motion.div 
            className="bg-background rounded-xl p-4 space-y-3"
            layout
          >
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Chance for gevinst</span>
              <motion.span 
                key={winChance}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className={cn(
                  "font-semibold",
                  winChance > 50 ? "text-success" : winChance > 25 ? "text-accent" : "text-destructive"
                )}
              >
                {winChance}%
              </motion.span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Multiplier</span>
              <motion.span 
                key={multiplier}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="font-semibold text-success"
              >
                x{multiplier.toFixed(2)}
              </motion.span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-muted-foreground">Potentiel gevinst</span>
              <motion.span 
                key={potentialWin}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="font-bold text-primary text-lg"
              >
                {formatShards(potentialWin)}
              </motion.span>
            </div>
          </motion.div>

          {/* Play Button */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              className={cn(
                "w-full h-14 text-lg font-semibold transition-all duration-300",
                isRolling 
                  ? "bg-muted" 
                  : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              )}
              onClick={handlePlay}
              disabled={playDice.isPending || isRolling || betAmount > (balance?.balance || 0)}
            >
              {isRolling ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                >
                  <DiceIcon className="w-6 h-6" />
                </motion.div>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Rul Terning ({formatShards(betAmount)} Shards)
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Dice Display */}
        <div className="flex flex-col items-center justify-center order-first lg:order-last">
          {/* Roll Result Display */}
          <motion.div
            className={cn(
              "relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-background border-2 flex items-center justify-center overflow-hidden transition-colors duration-300",
              lastResult?.isWin && !isRolling ? "border-success shadow-lg shadow-success/20" : 
              lastResult && !lastResult.isWin && !isRolling ? "border-destructive shadow-lg shadow-destructive/20" : 
              "border-border"
            )}
            animate={diceControls}
          >
            {/* Animated background gradient */}
            <motion.div 
              className={cn(
                "absolute inset-0 opacity-20",
                lastResult?.isWin ? "bg-gradient-to-br from-success to-success/50" :
                lastResult && !lastResult.isWin ? "bg-gradient-to-br from-destructive to-destructive/50" :
                "bg-gradient-to-br from-primary/20 to-transparent"
              )}
              animate={isRolling ? { 
                background: [
                  'linear-gradient(0deg, hsl(var(--primary) / 0.2), transparent)',
                  'linear-gradient(90deg, hsl(var(--primary) / 0.2), transparent)',
                  'linear-gradient(180deg, hsl(var(--primary) / 0.2), transparent)',
                  'linear-gradient(270deg, hsl(var(--primary) / 0.2), transparent)',
                  'linear-gradient(360deg, hsl(var(--primary) / 0.2), transparent)',
                ]
              } : {}}
              transition={{ duration: 1, repeat: isRolling ? Infinity : 0 }}
            />
            
            <motion.div
              animate={resultControls}
              className="text-center relative z-10"
            >
              <motion.span 
                key={displayRoll}
                initial={isRolling ? { scale: 0.8, opacity: 0.5 } : { scale: 1.2 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "text-6xl font-heading font-bold",
                  lastResult?.isWin && !isRolling ? "text-success" :
                  lastResult && !lastResult.isWin && !isRolling ? "text-destructive" :
                  "text-foreground"
                )}
              >
                {displayRoll}
              </motion.span>
            </motion.div>
            
            {/* Dice icon in corner */}
            <motion.div 
              className="absolute bottom-3 right-3 opacity-30"
              animate={isRolling ? { rotate: [0, 360] } : {}}
              transition={{ duration: 0.3, repeat: isRolling ? Infinity : 0 }}
            >
              <DiceIcon className="w-8 h-8 text-muted-foreground" />
            </motion.div>
          </motion.div>

          {/* Target Indicator */}
          <div className="mt-6 w-full">
            <div className="relative h-10 bg-muted rounded-full overflow-hidden">
              {/* Under section */}
              <motion.div 
                className="absolute left-0 top-0 bottom-0 bg-accent/40"
                initial={{ width: 0 }}
                animate={{ width: `${targetNumber}%` }}
                transition={{ type: "spring", stiffness: 100 }}
              />
              {/* Over section */}
              <motion.div 
                className="absolute right-0 top-0 bottom-0 bg-success/40"
                initial={{ width: 0 }}
                animate={{ width: `${100 - targetNumber}%` }}
                transition={{ type: "spring", stiffness: 100 }}
              />
              
              {/* Selection highlight */}
              <motion.div
                className={cn(
                  "absolute top-0 bottom-0",
                  isOver ? "right-0 bg-success/20" : "left-0 bg-accent/20"
                )}
                animate={{ 
                  width: isOver ? `${100 - targetNumber}%` : `${targetNumber}%`,
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  width: { type: "spring", stiffness: 100 },
                  opacity: { duration: 2, repeat: Infinity }
                }}
              />
              
              {/* Target line */}
              <motion.div 
                className="absolute top-0 bottom-0 w-1 bg-foreground z-10 rounded-full shadow-lg"
                animate={{ left: `calc(${targetNumber}% - 2px)` }}
                transition={{ type: "spring", stiffness: 150 }}
              />
              
              {/* Roll indicator */}
              <AnimatePresence>
                {lastRoll !== null && !isRolling && (
                  <motion.div
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0, y: 20 }}
                    className={cn(
                      "absolute top-1 bottom-1 w-8 h-8 rounded-full border-2 z-20 flex items-center justify-center text-xs font-bold shadow-lg",
                      lastResult?.isWin 
                        ? "bg-success border-success text-success-foreground" 
                        : "bg-destructive border-destructive text-destructive-foreground"
                    )}
                    style={{ left: `calc(${lastRoll}% - 16px)` }}
                  >
                    {lastRoll}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span className="text-accent font-medium">Under</span>
              <span className="text-foreground font-medium">{targetNumber}</span>
              <span className="text-success font-medium">Over</span>
            </div>
          </div>

          {/* Recent Rolls History */}
          <div className="mt-6 w-full">
            <div className="text-xs text-muted-foreground mb-2">Seneste rul</div>
            <div className="flex gap-1.5 justify-center flex-wrap">
              <AnimatePresence mode="popLayout">
                {rollHistory.map((item, index) => (
                  <motion.div
                    key={item.timestamp}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 - index * 0.08 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border",
                      item.isWin 
                        ? "bg-success/10 border-success/30 text-success" 
                        : "bg-destructive/10 border-destructive/30 text-destructive"
                    )}
                  >
                    {item.roll}
                  </motion.div>
                ))}
              </AnimatePresence>
              {rollHistory.length === 0 && (
                <span className="text-xs text-muted-foreground">Ingen rul endnu</span>
              )}
            </div>
          </div>

          {/* Result Message */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={cn(
                  "mt-6 px-6 py-4 rounded-xl text-center relative overflow-hidden w-full",
                  lastResult.isWin ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30"
                )}
              >
                {/* Animated shine effect */}
                <motion.div
                  className={cn(
                    "absolute inset-0",
                    lastResult.isWin 
                      ? "bg-gradient-to-r from-transparent via-success/10 to-transparent" 
                      : "bg-gradient-to-r from-transparent via-destructive/10 to-transparent"
                  )}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: 2, ease: "linear" }}
                />
                
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {lastResult.isWin ? (
                    <Trophy className="w-5 h-5 text-success" />
                  ) : null}
                  <p className={cn(
                    "font-bold text-lg",
                    lastResult.isWin ? "text-success" : "text-destructive"
                  )}>
                    {lastResult.isWin 
                      ? `+${formatShards(lastResult.winAmount)} Shards!`
                      : `Tabte! Rullen var ${lastRoll}`
                    }
                  </p>
                </div>
                {lastResult.isWin && streak > 1 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-success/80 mt-1"
                  >
                    🔥 {streak} sejre i træk!
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DiceGame;