import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Loader2, Zap, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useShardBalance } from '@/hooks/useShards';
import { usePlayDice, calculateDiceMultiplier } from '@/hooks/useGames';
import { cn } from '@/lib/utils';

const DiceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

const DiceGame = () => {
  const { data: balance } = useShardBalance();
  const playDice = usePlayDice();

  const [betAmount, setBetAmount] = useState(100);
  const [targetNumber, setTargetNumber] = useState(50);
  const [isOver, setIsOver] = useState(true);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<{ isWin: boolean; winAmount: number } | null>(null);

  const winChance = isOver ? (99 - targetNumber) : (targetNumber - 1);
  const multiplier = calculateDiceMultiplier(winChance);
  const potentialWin = Math.floor(betAmount * multiplier);

  const handlePlay = async () => {
    if (betAmount < 10 || betAmount > (balance?.balance || 0)) return;
    
    setIsRolling(true);
    setLastResult(null);
    
    // Animate random dice for effect
    const animationInterval = setInterval(() => {
      setLastRoll(Math.floor(Math.random() * 100) + 1);
    }, 50);

    try {
      const result = await playDice.mutateAsync({ betAmount, targetNumber, isOver });
      
      // Stop animation after a moment
      setTimeout(() => {
        clearInterval(animationInterval);
        setLastRoll(result.roll);
        setLastResult({ isWin: result.isWin, winAmount: result.winAmount });
        setIsRolling(false);
      }, 500);
    } catch (e) {
      clearInterval(animationInterval);
      setIsRolling(false);
    }
  };

  const formatShards = (shards: number) => {
    return new Intl.NumberFormat('da-DK').format(shards);
  };

  const quickBets = [100, 500, 1000, 5000];

  // Get a dice icon based on the roll (map 1-100 to 6 dice faces)
  const getDiceIcon = (roll: number) => {
    const index = Math.floor((roll - 1) / 100 * 6);
    const Icon = DiceIcons[Math.min(index, 5)];
    return <Icon className="w-16 h-16" />;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Dice6 className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="font-heading text-xl text-foreground">Dice</h2>
          <p className="text-sm text-muted-foreground">Forudsig om terningen ruller over eller under!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 0))}
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
                <Button
                  key={qb}
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setBetAmount(qb)}
                  disabled={isRolling || qb > (balance?.balance || 0)}
                >
                  {qb}
                </Button>
              ))}
            </div>
          </div>

          {/* Over/Under Toggle */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Forudsigelse
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={isOver ? "default" : "outline"}
                onClick={() => setIsOver(true)}
                disabled={isRolling}
                className={cn(
                  isOver && "bg-success hover:bg-success/90 text-success-foreground"
                )}
              >
                <ArrowUp className="w-4 h-4 mr-2" />
                Over {targetNumber}
              </Button>
              <Button
                variant={!isOver ? "default" : "outline"}
                onClick={() => setIsOver(false)}
                disabled={isRolling}
                className={cn(
                  !isOver && "bg-accent hover:bg-accent/90 text-accent-foreground"
                )}
              >
                <ArrowDown className="w-4 h-4 mr-2" />
                Under {targetNumber}
              </Button>
            </div>
          </div>

          {/* Target Number Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-muted-foreground">
                Måltal
              </label>
              <span className="text-sm font-medium text-foreground">{targetNumber}</span>
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
          <div className="bg-background rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chance for gevinst</span>
              <span className="font-semibold text-foreground">{winChance}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Multiplier</span>
              <span className="font-semibold text-success">x{multiplier.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Potentiel gevinst</span>
              <span className="font-semibold text-primary">{formatShards(potentialWin)}</span>
            </div>
          </div>

          {/* Play Button */}
          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={handlePlay}
            disabled={playDice.isPending || isRolling || betAmount > (balance?.balance || 0)}
          >
            {isRolling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Rul Terning ({formatShards(betAmount)} Shards)
              </>
            )}
          </Button>
        </div>

        {/* Dice Display */}
        <div className="flex flex-col items-center justify-center">
          {/* Roll Result Display */}
          <motion.div
            className="relative w-40 h-40 rounded-2xl bg-background border-2 border-border flex items-center justify-center"
            animate={isRolling ? { rotate: [0, 360] } : undefined}
            transition={{ duration: 0.3, repeat: isRolling ? Infinity : 0 }}
          >
            {lastRoll !== null ? (
              <motion.div
                key={lastRoll}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <span className="text-5xl font-heading text-foreground">{lastRoll}</span>
              </motion.div>
            ) : (
              <div className="text-muted-foreground">
                {getDiceIcon(50)}
              </div>
            )}
          </motion.div>

          {/* Target Indicator */}
          <div className="mt-6 w-full">
            <div className="relative h-8 bg-muted rounded-full overflow-hidden">
              {/* Under section */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-accent/30"
                style={{ width: `${targetNumber}%` }}
              />
              {/* Over section */}
              <div 
                className="absolute right-0 top-0 bottom-0 bg-success/30"
                style={{ width: `${100 - targetNumber}%` }}
              />
              {/* Target line */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10"
                style={{ left: `${targetNumber}%` }}
              />
              {/* Roll indicator */}
              {lastRoll !== null && !isRolling && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "absolute top-1 bottom-1 w-6 h-6 rounded-full border-2 z-20 flex items-center justify-center text-xs font-bold",
                    lastResult?.isWin 
                      ? "bg-success border-success text-success-foreground" 
                      : "bg-destructive border-destructive text-destructive-foreground"
                  )}
                  style={{ left: `calc(${lastRoll}% - 12px)` }}
                >
                  {lastRoll}
                </motion.div>
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>0</span>
              <span className="text-foreground font-medium">Under ← {targetNumber} → Over</span>
              <span>100</span>
            </div>
          </div>

          {/* Result Message */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "mt-6 px-6 py-3 rounded-xl text-center",
                  lastResult.isWin ? "bg-success/10" : "bg-destructive/10"
                )}
              >
                <p className={cn(
                  "font-semibold",
                  lastResult.isWin ? "text-success" : "text-destructive"
                )}>
                  {lastResult.isWin 
                    ? `Tillykke! +${formatShards(lastResult.winAmount)} Shards!`
                    : `Tabte! Rullen var ${lastRoll}`
                  }
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DiceGame;
