import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Zap, Loader2, Sparkles, RotateCcw, TrendingUp, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useShardBalance } from '@/hooks/useShards';
import { usePlayLines } from '@/hooks/useGames';
import { cn } from '@/lib/utils';

const SYMBOLS = [
  { id: 'gem',     emoji: '💎', label: 'Gem',     multiplier: 50  },
  { id: 'crown',   emoji: '👑', label: 'Crown',   multiplier: 25  },
  { id: 'fire',    emoji: '🔥', label: 'Fire',    multiplier: 12  },
  { id: 'bolt',    emoji: '⚡', label: 'Bolt',    multiplier: 8   },
  { id: 'star',    emoji: '⭐', label: 'Star',    multiplier: 5   },
  { id: 'coin',    emoji: '🪙', label: 'Coin',    multiplier: 3   },
  { id: 'crystal', emoji: '🔷', label: 'Crystal', multiplier: 2   },
  { id: 'dice',    emoji: '🎲', label: 'Dice',    multiplier: 1.5 },
];

const LINE_COLORS = [
  'from-primary/30 to-primary/10 border-primary/40',
  'from-blue-500/30 to-blue-500/10 border-blue-500/40',
  'from-emerald-500/30 to-emerald-500/10 border-emerald-500/40',
  'from-amber-500/30 to-amber-500/10 border-amber-500/40',
  'from-rose-500/30 to-rose-500/10 border-rose-500/40',
];

const LINE_GLOW = [
  'shadow-primary/40',
  'shadow-blue-500/40',
  'shadow-emerald-500/40',
  'shadow-amber-500/40',
  'shadow-rose-500/40',
];

const WIN_BORDER = [
  'border-primary',
  'border-blue-500',
  'border-emerald-500',
  'border-amber-500',
  'border-rose-500',
];

interface DiceSymbol {
  id: string;
  emoji: string;
  label: string;
  multiplier: number;
}

interface LineResult {
  dice: DiceSymbol[];
  isWin: boolean;
  multiplier: number;
  win: number;
}

interface SpinResult {
  lineResults: LineResult[];
  totalBet: number;
  totalWin: number;
  netResult: number;
  newBalance: number;
  winningLines: number;
}

// Individual die cell with rolling animation
const DieFace = ({
  symbol,
  isRolling,
  rollDelay,
  isWin,
  isNew,
}: {
  symbol: DiceSymbol | null;
  isRolling: boolean;
  rollDelay: number;
  isWin: boolean;
  isNew: boolean;
}) => {
  return (
    <motion.div
      className={cn(
        'relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl',
        'border-2 transition-all duration-300 select-none overflow-hidden',
        isWin
          ? 'bg-success/15 border-success shadow-lg shadow-success/30'
          : 'bg-muted/40 border-border/60'
      )}
      initial={isNew ? { rotateX: 0 } : false}
      animate={
        isRolling
          ? { rotateX: [0, 90, 180, 270, 360], scale: [1, 0.85, 1, 0.85, 1] }
          : { rotateX: 0, scale: 1 }
      }
      transition={
        isRolling
          ? {
              duration: 0.45,
              delay: rollDelay,
              ease: 'easeInOut',
              repeat: 3,
              repeatType: 'loop',
            }
          : { type: 'spring', stiffness: 300, damping: 22 }
      }
      style={{ perspective: '200px', transformStyle: 'preserve-3d' }}
    >
      {/* Rolling blur overlay */}
      <AnimatePresence>
        {isRolling && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/20 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, repeat: Infinity, delay: rollDelay }}
          />
        )}
      </AnimatePresence>

      {/* Win glow ring */}
      {isWin && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-success"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}

      <motion.span
        key={symbol?.id}
        initial={isNew ? { scale: 0, rotate: -20 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 18, delay: rollDelay + 0.15 }}
        className="relative z-10"
      >
        {symbol ? symbol.emoji : '❓'}
      </motion.span>
    </motion.div>
  );
};

// One entire line of 3 dice
const GameLine = ({
  lineIndex,
  dice,
  isRolling,
  isWin,
  win,
  multiplier,
  isNew,
  isActive,
}: {
  lineIndex: number;
  dice: DiceSymbol[] | null;
  isRolling: boolean;
  isWin: boolean;
  win: number;
  multiplier: number;
  isNew: boolean;
  isActive: boolean;
}) => {
  const baseDelay = lineIndex * 0.12;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isActive ? 1 : 0.35, x: 0 }}
      transition={{ delay: lineIndex * 0.06 }}
      className="relative"
    >
      <div
        className={cn(
          'relative rounded-2xl border bg-gradient-to-r p-3 sm:p-4 transition-all duration-500',
          LINE_COLORS[lineIndex],
          isWin && 'shadow-xl',
          isWin && LINE_GLOW[lineIndex],
        )}
      >
        {/* Line label */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-background',
                lineIndex === 0 ? 'bg-primary' :
                lineIndex === 1 ? 'bg-blue-500' :
                lineIndex === 2 ? 'bg-emerald-500' :
                lineIndex === 3 ? 'bg-amber-500' : 'bg-rose-500'
              )}
            >
              {lineIndex + 1}
            </div>
            <span className="text-xs font-medium text-muted-foreground">Linje {lineIndex + 1}</span>
          </div>

          {/* Win badge */}
          <AnimatePresence>
            {isWin && win > 0 && (
              <motion.div
                initial={{ scale: 0, x: 20 }}
                animate={{ scale: 1, x: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/20 border border-success/40"
              >
                <Trophy className="w-3 h-3 text-success" />
                <span className="text-xs font-bold text-success">+{win.toLocaleString('da-DK')}</span>
                <span className="text-[10px] text-success/70">x{multiplier}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dice row */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {[0, 1, 2].map(dieIdx => (
            <DieFace
              key={dieIdx}
              symbol={dice ? dice[dieIdx] : null}
              isRolling={isRolling}
              rollDelay={baseDelay + dieIdx * 0.08}
              isWin={isWin}
              isNew={isNew}
            />
          ))}
        </div>

        {/* Win line sweep animation */}
        <AnimatePresence>
          {isWin && (
            <motion.div
              className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                initial={{ left: '-20%' }}
                animate={{ left: '120%' }}
                transition={{ duration: 0.7, delay: baseDelay + 0.6 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Paytable popup
const Paytable = ({ onClose }: { onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 10 }}
    className="absolute inset-x-0 top-full mt-2 z-50 bg-card border border-border rounded-2xl p-4 shadow-2xl"
  >
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-sm">Udbetalingsoversigt (3 ens)</h3>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded-lg hover:bg-muted transition-colors">Luk</button>
    </div>
    <div className="space-y-1.5">
      {SYMBOLS.map(sym => (
        <div key={sym.id} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">{sym.emoji} {sym.emoji} {sym.emoji}</span>
          </div>
          <span className="font-bold text-primary">x{sym.multiplier}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

const LinesGame = () => {
  const { data: balance, refetch: refetchBalance } = useShardBalance();
  const { spin } = usePlayLines();

  const [betPerLine, setBetPerLine] = useState(100);
  const [lineCount, setLineCount] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPaytable, setShowPaytable] = useState(false);
  const [history, setHistory] = useState<{ net: number; lines: number }[]>([]);
  const [diceRevealDone, setDiceRevealDone] = useState(false);

  const totalBet = betPerLine * lineCount;
  const canSpin = !isSpinning && totalBet <= (balance?.balance || 0) && betPerLine >= 10;

  const formatShards = (n: number) => new Intl.NumberFormat('da-DK').format(n);
  const quickBets = [50, 100, 500, 1000];

  const handleSpin = useCallback(async () => {
    if (!canSpin) return;

    setIsSpinning(true);
    setIsRolling(true);
    setShowResult(false);
    setResult(null);
    setDiceRevealDone(false);
    setShowCelebration(false);

    // Rolling animation for 1.8s + stagger per line
    const rollDuration = 1800 + lineCount * 120;

    try {
      const data = await spin.mutateAsync({ betAmount: betPerLine, lines: lineCount });

      // Wait for rolling animation
      await new Promise(r => setTimeout(r, rollDuration));
      setIsRolling(false);

      // Brief pause then reveal
      await new Promise(r => setTimeout(r, 120));
      setResult(data);
      setDiceRevealDone(true);

      await new Promise(r => setTimeout(r, 400));
      setShowResult(true);

      if (data.totalWin > 0) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3500);
      }

      setHistory(prev => [{ net: data.netResult, lines: data.winningLines }, ...prev.slice(0, 14)]);
      refetchBalance();
    } catch {
      setIsRolling(false);
    } finally {
      setIsSpinning(false);
    }
  }, [canSpin, betPerLine, lineCount, spin, refetchBalance]);

  const bigWin = result && result.totalWin >= totalBet * 5;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 relative overflow-hidden">
      {/* Celebration particles */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div className="absolute inset-0 pointer-events-none z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ x: `${30 + Math.random() * 40}%`, y: '50%', scale: 0, opacity: 1 }}
                animate={{
                  x: `${5 + Math.random() * 90}%`,
                  y: `${Math.random() * 90}%`,
                  scale: [0, 1.8, 0.6],
                  opacity: [1, 1, 0],
                  rotate: Math.random() * 720 - 360,
                }}
                transition={{ duration: 2 + Math.random() * 1, delay: Math.random() * 0.5, ease: 'easeOut' }}
              >
                {['✨', '💫', '⭐', '🌟'][Math.floor(Math.random() * 4)]}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big Win banner */}
      <AnimatePresence>
        {bigWin && showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-center pointer-events-none"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="px-8 py-4 rounded-2xl bg-primary/90 backdrop-blur-sm border-2 border-primary shadow-2xl shadow-primary/50"
            >
              <div className="text-4xl mb-1">🏆</div>
              <div className="font-heading text-2xl text-primary-foreground">BIG WIN!</div>
              <div className="text-primary-foreground/80 font-bold text-lg">+{formatShards(result!.totalWin)}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center">
            <span className="text-xl">🎰</span>
          </div>
          <div>
            <h2 className="font-heading text-xl text-foreground">Lines</h2>
            <p className="text-sm text-muted-foreground">Match 3 symboler på dine linjer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowPaytable(v => !v)}
            >
              Udbetalinger
            </Button>
            <AnimatePresence>
              {showPaytable && <Paytable onClose={() => setShowPaytable(false)} />}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_260px] gap-5">
        {/* Left: Game Lines */}
        <div className="space-y-2.5 order-first">
          {[...Array(5)].map((_, i) => {
            const lineResult = result?.lineResults[i];
            return (
              <GameLine
                key={i}
                lineIndex={i}
                dice={lineResult ? lineResult.dice : null}
                isRolling={isRolling}
                isWin={lineResult?.isWin || false}
                win={lineResult?.win || 0}
                multiplier={lineResult?.multiplier || 0}
                isNew={diceRevealDone}
                isActive={i < lineCount}
              />
            );
          })}

          {/* Result summary */}
          <AnimatePresence>
            {showResult && result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'rounded-xl p-3 border flex items-center justify-between',
                  result.totalWin > 0
                    ? 'bg-success/10 border-success/30'
                    : 'bg-destructive/10 border-destructive/30'
                )}
              >
                <div>
                  <span className="text-sm text-muted-foreground">
                    {result.winningLines > 0
                      ? `${result.winningLines} gevinst${result.winningLines !== 1 ? 'er' : ''}`
                      : 'Ingen gevinster'}
                  </span>
                  {result.winningLines > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Indsats: {formatShards(result.totalBet)}
                    </div>
                  )}
                </div>
                <motion.div
                  initial={{ scale: 0.7 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className={cn(
                    'font-bold text-lg',
                    result.netResult >= 0 ? 'text-success' : 'text-destructive'
                  )}
                >
                  {result.netResult >= 0 ? '+' : ''}{formatShards(result.netResult)}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Controls */}
        <div className="space-y-4 order-last lg:order-first">
          {/* Balance */}
          <div className="bg-background/60 rounded-xl p-3 flex items-center justify-between border border-border/40">
            <span className="text-sm text-muted-foreground">Din saldo</span>
            <motion.span
              key={balance?.balance}
              initial={{ scale: 1.1, color: 'hsl(var(--success))' }}
              animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
              className="font-bold text-lg"
            >
              {formatShards(balance?.balance || 0)}
            </motion.span>
          </div>

          {/* Lines selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-muted-foreground">Antal linjer</label>
              <span className="text-xs text-muted-foreground">Maks. 5</span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <motion.button
                  key={n}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setLineCount(n)}
                  disabled={isSpinning}
                  className={cn(
                    'flex-1 h-10 rounded-xl text-sm font-bold border transition-all duration-200',
                    lineCount === n
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30'
                      : 'bg-muted/40 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  {n}
                </motion.button>
              ))}
            </div>
            {/* Line indicators */}
            <div className="mt-2 flex gap-1">
              {[0,1,2,3,4].map(i => (
                <div
                  key={i}
                  className={cn(
                    'flex-1 h-1 rounded-full transition-all duration-300',
                    i < lineCount
                      ? i === 0 ? 'bg-primary' :
                        i === 1 ? 'bg-blue-500' :
                        i === 2 ? 'bg-emerald-500' :
                        i === 3 ? 'bg-amber-500' : 'bg-rose-500'
                      : 'bg-muted/30'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Bet per line */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Indsats per linje</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => setBetPerLine(prev => Math.max(10, prev - (prev <= 100 ? 10 : prev <= 500 ? 50 : 100)))}
                disabled={isSpinning || betPerLine <= 10}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={betPerLine}
                onChange={e => setBetPerLine(Math.max(10, parseInt(e.target.value) || 10))}
                className="bg-background text-center font-bold"
                disabled={isSpinning}
              />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => setBetPerLine(prev => Math.min(prev + (prev < 100 ? 10 : prev < 500 ? 50 : 100), Math.floor((balance?.balance || 0) / lineCount)))}
                disabled={isSpinning}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-1.5 mt-2">
              {quickBets.map(qb => (
                <Button
                  key={qb}
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-xs h-8"
                  onClick={() => setBetPerLine(qb)}
                  disabled={isSpinning || qb * lineCount > (balance?.balance || 0)}
                >
                  {qb}
                </Button>
              ))}
            </div>
          </div>

          {/* Total bet summary */}
          <div className="bg-background/40 rounded-xl p-3 space-y-1.5 border border-border/30">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Indsats/linje</span>
              <span className="font-medium">{formatShards(betPerLine)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Linjer</span>
              <span className="font-medium">×{lineCount}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-border/30">
              <span className="text-sm font-semibold">Total indsats</span>
              <motion.span key={totalBet} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="font-bold text-primary">
                {formatShards(totalBet)}
              </motion.span>
            </div>
          </div>

          {/* Half / Double */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setBetPerLine(prev => Math.max(10, Math.floor(prev / 2)))}
              disabled={isSpinning || betPerLine <= 10}
            >
              ½
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setBetPerLine(prev => Math.min(prev * 2, Math.floor((balance?.balance || 0) / lineCount)))}
              disabled={isSpinning}
            >
              2×
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setBetPerLine(Math.floor((balance?.balance || 0) / lineCount))}
              disabled={isSpinning}
            >
              Max
            </Button>
          </div>

          {/* Spin button */}
          <motion.div
            whileTap={canSpin ? { scale: 0.97 } : {}}
            animate={
              canSpin && !isSpinning
                ? {
                    boxShadow: [
                      '0 0 0px hsl(var(--primary))',
                      '0 0 30px hsl(var(--primary) / 0.45)',
                      '0 0 0px hsl(var(--primary))',
                    ],
                  }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
            className="rounded-xl"
          >
            <Button
              className="w-full h-14 text-base font-bold gap-2 relative overflow-hidden"
              onClick={handleSpin}
              disabled={!canSpin}
            >
              {isSpinning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Snurrer...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  SPIN — {formatShards(totalBet)} Shards
                </>
              )}
              {/* Button sweep shine */}
              {canSpin && !isSpinning && (
                <motion.div
                  className="absolute top-0 bottom-0 w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ left: ['-15%', '115%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              )}
            </Button>
          </motion.div>

          {/* History mini strip */}
          {history.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Historik
              </p>
              <div className="flex gap-1 flex-wrap">
                {history.slice(0, 10).map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className={cn(
                      'px-1.5 py-0.5 rounded-md text-[11px] font-bold border',
                      h.net >= 0
                        ? 'bg-success/10 border-success/30 text-success'
                        : 'bg-destructive/10 border-destructive/30 text-destructive'
                    )}
                  >
                    {h.net >= 0 ? '+' : ''}{h.net > 0 ? formatShards(h.net) : formatShards(h.net)}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinesGame;
