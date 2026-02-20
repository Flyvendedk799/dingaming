import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Zap, Loader2, Sparkles, Trophy, RotateCcw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useShardBalance } from '@/hooks/useShards';
import { usePlayHiLo } from '@/hooks/useGames';
import { cn } from '@/lib/utils';

interface Card {
  suit: string;
  rank: string;
  value: number;
}

const suitSymbol = (suit: string) => {
  return suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-foreground';
};

const CardFace = ({
  card,
  isFlipping,
  isNew,
  isLoss,
}: {
  card: Card;
  isFlipping?: boolean;
  isNew?: boolean;
  isLoss?: boolean;
}) => (
  <motion.div
    className={cn(
      'relative w-28 h-40 sm:w-36 sm:h-52 rounded-2xl border-2 flex flex-col items-center justify-center font-bold select-none shadow-2xl',
      isLoss ? 'bg-destructive/10 border-destructive/50' : 'bg-card border-border'
    )}
    initial={isNew ? { rotateY: 180, scale: 0.6, opacity: 0 } : false}
    animate={{ rotateY: 0, scale: 1, opacity: 1 }}
    transition={{ duration: 0.7, type: 'spring', stiffness: 180, damping: 18 }}
    style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
  >
    {/* Card shine effect */}
    <motion.div
      className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
      initial={{ opacity: 0 }}
      animate={isNew ? { opacity: [0, 0.4, 0] } : { opacity: 0 }}
      transition={{ duration: 1, delay: 0.3 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
    </motion.div>

    <span className={cn('text-sm absolute top-3 left-3', suitSymbol(card.suit))}>
      {card.rank}
    </span>
    <motion.span
      className={cn('text-5xl sm:text-6xl', suitSymbol(card.suit))}
      initial={isNew ? { scale: 0 } : false}
      animate={{ scale: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
    >
      {card.suit}
    </motion.span>
    <span className={cn('text-sm absolute bottom-3 right-3 rotate-180', suitSymbol(card.suit))}>
      {card.rank}
    </span>

    {/* Rank display in corner */}
    <motion.div
      className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg"
      initial={isNew ? { scale: 0, rotate: -180 } : false}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 250 }}
    >
      <span className="text-primary-foreground text-sm font-bold">{card.value}</span>
    </motion.div>
  </motion.div>
);

const CardBack = () => (
  <div className="relative w-28 h-40 sm:w-36 sm:h-52 rounded-2xl border-2 border-primary/30 flex items-center justify-center shadow-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 overflow-hidden">
    <div className="absolute inset-2 rounded-xl border border-primary/20" />
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      className="text-primary/30 text-4xl"
    >
      ♠♥♦♣
    </motion.div>
  </div>
);

// History trail of cards
const CardTrail = ({ history }: { history: Card[] }) => (
  <div className="flex gap-1.5 items-center overflow-x-auto pb-1 scrollbar-hide">
    {history.map((card, i) => (
      <motion.div
        key={`${i}-${card.rank}${card.suit}`}
        initial={{ scale: 0, x: 20 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
        className={cn(
          'shrink-0 w-8 h-11 rounded-lg border flex items-center justify-center text-xs font-bold',
          card.suit === '♥' || card.suit === '♦'
            ? 'border-red-500/30 text-red-400 bg-red-500/5'
            : 'border-border text-foreground bg-muted/50'
        )}
      >
        <span className="text-[10px]">{card.rank}</span>
      </motion.div>
    ))}
  </div>
);

const HiLoGame = () => {
  const { data: balance, refetch: refetchBalance } = useShardBalance();
  const { startGame, makeGuess, cashOut } = usePlayHiLo();

  const [betAmount, setBetAmount] = useState(100);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [previousCard, setPreviousCard] = useState<Card | null>(null);
  const [streak, setStreak] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [higherMult, setHigherMult] = useState(0);
  const [lowerMult, setLowerMult] = useState(0);
  const [potentialWin, setPotentialWin] = useState(0);
  const [history, setHistory] = useState<Card[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isGuessing, setIsGuessing] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isCardNew, setIsCardNew] = useState(false);
  const [lastGuessCorrect, setLastGuessCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [winAmount, setWinAmount] = useState(0);

  const isPlaying = sessionId !== null && !gameOver;
  const isBusy = isStarting || isGuessing || isCashingOut;

  // Celebration
  useEffect(() => {
    if (showCelebration) {
      const t = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showCelebration]);

  // Streak correct flash
  useEffect(() => {
    if (lastGuessCorrect !== null) {
      const t = setTimeout(() => setLastGuessCorrect(null), 1200);
      return () => clearTimeout(t);
    }
  }, [lastGuessCorrect]);

  const resetGame = useCallback(() => {
    setSessionId(null);
    setCurrentCard(null);
    setPreviousCard(null);
    setStreak(0);
    setCurrentMultiplier(1);
    setHigherMult(0);
    setLowerMult(0);
    setPotentialWin(0);
    setHistory([]);
    setGameOver(false);
    setGameWon(false);
    setIsCardNew(false);
    setLastGuessCorrect(null);
    setShowResult(false);
    setWinAmount(0);
  }, []);

  const handleStart = async () => {
    if (isBusy || betAmount < 10 || betAmount > (balance?.balance || 0)) return;
    setIsStarting(true);
    resetGame();

    try {
      const result = await startGame.mutateAsync({ betAmount });
      setSessionId(result.sessionId);
      setCurrentCard(result.currentCard);
      setHigherMult(result.higherMultiplier);
      setLowerMult(result.lowerMultiplier);
      setPotentialWin(result.potentialWin);
      setHistory([result.currentCard]);
      setIsCardNew(true);
      setTimeout(() => setIsCardNew(false), 800);
      refetchBalance();
    } catch {
      // handled
    } finally {
      setIsStarting(false);
    }
  };

  const handleGuess = async (guess: 'higher' | 'lower') => {
    if (!sessionId || isBusy || !isPlaying) return;
    setIsGuessing(true);
    setPreviousCard(currentCard);

    try {
      const result = await makeGuess.mutateAsync({ sessionId, guess });

      // Dramatic pause before reveal
      await new Promise(r => setTimeout(r, 400));

      setIsCardNew(true);
      setCurrentCard(result.nextCard);
      setHistory(prev => [...prev, result.nextCard]);

      // Wait for card flip animation
      await new Promise(r => setTimeout(r, 700));

      if (result.isWin) {
        setLastGuessCorrect(true);
        setStreak(result.streak);
        setCurrentMultiplier(result.currentMultiplier);
        setHigherMult(result.higherMultiplier);
        setLowerMult(result.lowerMultiplier);
        setPotentialWin(result.potentialWin);

        if (result.isTie) {
          // Tie – subtle feedback
          setLastGuessCorrect(null);
        }
      } else {
        setLastGuessCorrect(false);
        setGameOver(true);
        setShowResult(true);
        refetchBalance();
      }

      setTimeout(() => setIsCardNew(false), 100);
    } catch {
      // handled
    } finally {
      setIsGuessing(false);
    }
  };

  const handleCashout = async () => {
    if (!sessionId || isBusy || !isPlaying || streak === 0) return;
    setIsCashingOut(true);

    try {
      const result = await cashOut.mutateAsync({ sessionId });
      setWinAmount(result.winAmount);
      setGameWon(true);
      setGameOver(true);
      setShowCelebration(true);
      setShowResult(true);
      refetchBalance();
    } catch {
      // handled
    } finally {
      setIsCashingOut(false);
    }
  };

  const formatShards = (s: number) => new Intl.NumberFormat('da-DK').format(s);
  const quickBets = [100, 500, 1000, 5000];

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 relative overflow-hidden">
      {/* Win celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div className="absolute inset-0 pointer-events-none z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[...Array(25)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ x: '50%', y: '40%', scale: 0, opacity: 1 }}
                animate={{
                  x: `${10 + Math.random() * 80}%`,
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1.5, 0.5],
                  opacity: [1, 1, 0],
                  rotate: Math.random() * 720,
                }}
                transition={{ duration: 1.8, delay: Math.random() * 0.4, ease: 'easeOut' }}
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak glow background */}
      {isPlaying && streak > 0 && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: Math.min(streak * 0.04, 0.25),
            background: `radial-gradient(circle at center, hsl(var(--success) / 0.15), transparent 70%)`,
          }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Correct/Wrong flash */}
      <AnimatePresence>
        {lastGuessCorrect !== null && (
          <motion.div
            className={cn(
              'absolute inset-0 pointer-events-none z-40',
              lastGuessCorrect ? 'bg-success/10' : 'bg-destructive/10'
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
            <span className="text-xl">🃏</span>
          </div>
          <div>
            <h2 className="font-heading text-xl text-foreground">Hi-Lo</h2>
            <p className="text-sm text-muted-foreground">Gæt om næste kort er højere eller lavere!</p>
          </div>
        </div>

        {/* Streak badge */}
        <AnimatePresence>
          {streak > 0 && isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30"
            >
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm font-bold text-success">{streak}x streak</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-5 relative">
        {/* Left: Controls */}
        <div className="space-y-4">
          {/* Balance */}
          <div className="bg-background/50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Din saldo</span>
            <motion.span key={balance?.balance} initial={{ scale: 1.1, color: 'hsl(var(--success))' }} animate={{ scale: 1, color: 'hsl(var(--foreground))' }} className="font-bold text-lg">
              {formatShards(balance?.balance || 0)} Shards
            </motion.span>
          </div>

          {/* Bet controls (only before game) */}
          {!isPlaying && !gameOver && (
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Indsats</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                  onBlur={() => setBetAmount(prev => Math.max(10, prev))}
                  className="bg-background"
                />
                <Button variant="outline" size="sm" onClick={() => setBetAmount(Math.floor(betAmount / 2))} disabled={betAmount < 20}>½</Button>
                <Button variant="outline" size="sm" onClick={() => setBetAmount(Math.min(betAmount * 2, balance?.balance || 0))}>2×</Button>
              </div>
              <div className="flex gap-2 mt-2">
                {quickBets.map(qb => (
                  <Button key={qb} variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => setBetAmount(qb)} disabled={qb > (balance?.balance || 0)}>
                    {qb}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Game stats */}
          {(isPlaying || gameOver) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-background rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Indsats</span>
                <span className="font-semibold">{formatShards(betAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Streak</span>
                <motion.span key={streak} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-bold text-primary">{streak}</motion.span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Multiplier</span>
                <motion.span key={currentMultiplier} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-bold text-success">
                  x{currentMultiplier.toFixed(2)}
                </motion.span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-muted-foreground text-sm">Potentiel gevinst</span>
                <motion.span key={potentialWin} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="font-bold text-lg text-primary">
                  {formatShards(potentialWin)}
                </motion.span>
              </div>
            </motion.div>
          )}

          {/* Guess buttons */}
          {isPlaying && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    className="w-full h-16 text-base font-semibold bg-success hover:bg-success/90 flex flex-col gap-0.5"
                    onClick={() => handleGuess('higher')}
                    disabled={isBusy || higherMult === 0}
                  >
                    {isGuessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <span className="flex items-center gap-1"><ArrowUp className="w-5 h-5" /> Højere</span>
                        <span className="text-xs opacity-80">x{higherMult.toFixed(2)}</span>
                      </>
                    )}
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    className="w-full h-16 text-base font-semibold bg-accent hover:bg-accent/90 flex flex-col gap-0.5"
                    onClick={() => handleGuess('lower')}
                    disabled={isBusy || lowerMult === 0}
                  >
                    {isGuessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <span className="flex items-center gap-1"><ArrowDown className="w-5 h-5" /> Lavere</span>
                        <span className="text-xs opacity-80">x{lowerMult.toFixed(2)}</span>
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>

              {/* Cashout */}
              {streak > 0 && (
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    boxShadow: ['0 0 0px hsl(var(--primary))', '0 0 25px hsl(var(--primary) / 0.4)', '0 0 0px hsl(var(--primary))'],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="rounded-xl"
                >
                  <Button
                    className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
                    onClick={handleCashout}
                    disabled={isBusy}
                  >
                    {isCashingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <><Trophy className="w-5 h-5 mr-2" />Udbetal {formatShards(potentialWin)} Shards</>
                    )}
                  </Button>
                </motion.div>
              )}
            </div>
          )}

          {/* Start / New game */}
          {!isPlaying && (
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                onClick={gameOver ? () => { resetGame(); } : handleStart}
                disabled={isBusy || (!gameOver && (betAmount > (balance?.balance || 0) || betAmount < 10))}
              >
                {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : gameOver ? (
                  <><RotateCcw className="w-5 h-5 mr-2" />Nyt spil</>
                ) : (
                  <><Zap className="w-5 h-5 mr-2" />Start ({formatShards(betAmount)} Shards)</>
                )}
              </Button>
              {gameOver && !gameWon && (
                <p className="text-center text-sm text-muted-foreground mt-2">Tryk for at starte et nyt spil</p>
              )}
            </motion.div>
          )}

          {/* Card history trail */}
          {history.length > 1 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Korthistorik</label>
              <CardTrail history={history} />
            </div>
          )}
        </div>

        {/* Right: Card display */}
        <div className="flex flex-col items-center justify-center min-h-[300px] order-first lg:order-last">
          {!currentCard && !gameOver ? (
            <div className="text-center space-y-4">
              <motion.div
                animate={{ rotateY: [0, 180, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <CardBack />
              </motion.div>
              <p className="text-muted-foreground text-sm">Placer din indsats og start spillet</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {/* Previous card (small, faded) */}
              <AnimatePresence>
                {previousCard && isPlaying && (
                  <motion.div
                    initial={{ opacity: 1, scale: 1, y: 0 }}
                    animate={{ opacity: 0.3, scale: 0.6, y: -10 }}
                    exit={{ opacity: 0, scale: 0.4 }}
                    transition={{ duration: 0.5 }}
                    className="absolute top-4"
                  >
                    <div className={cn(
                      'w-16 h-24 rounded-xl border border-border/50 flex items-center justify-center bg-card/50',
                      previousCard.suit === '♥' || previousCard.suit === '♦' ? 'text-red-400/50' : 'text-foreground/50'
                    )}>
                      <span className="text-lg">{previousCard.rank}{previousCard.suit}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Current card */}
              {currentCard && (
                <CardFace
                  card={currentCard}
                  isNew={isCardNew}
                  isLoss={gameOver && !gameWon}
                />
              )}

              {/* Multiplier hint arrows */}
              {isPlaying && !isGuessing && (
                <div className="flex items-center gap-8 text-muted-foreground">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex flex-col items-center"
                  >
                    <ArrowUp className="w-5 h-5 text-success" />
                    <span className="text-xs text-success font-semibold">x{higherMult.toFixed(2)}</span>
                  </motion.div>
                  <span className="text-xs text-muted-foreground/50">eller</span>
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex flex-col items-center"
                  >
                    <ArrowDown className="w-5 h-5 text-accent" />
                    <span className="text-xs text-accent font-semibold">x{lowerMult.toFixed(2)}</span>
                  </motion.div>
                </div>
              )}

              {/* Result banner */}
              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      'w-full text-center py-4 rounded-xl font-heading text-xl',
                      gameWon
                        ? 'bg-success/10 text-success border border-success/30'
                        : 'bg-destructive/10 text-destructive border border-destructive/30'
                    )}
                  >
                    {gameWon ? (
                      <div>
                        <Trophy className="w-6 h-6 mx-auto mb-1" />
                        <div>🎉 Udbetalt {formatShards(winAmount)} Shards!</div>
                        <div className="text-sm opacity-80">x{currentMultiplier.toFixed(2)} • {streak} korrekte</div>
                      </div>
                    ) : (
                      <div>
                        <div>💀 Forkert gæt!</div>
                        <div className="text-sm opacity-80">Streak: {streak} korrekte</div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HiLoGame;
