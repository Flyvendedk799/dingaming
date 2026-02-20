import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Zap, Loader2, ArrowUp, ArrowDown, Trophy, TrendingUp, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useShardBalance } from '@/hooks/useShards';
import { usePlayLines, calculateDiceMultiplier, LineConfig, LinesSpinResponse } from '@/hooks/useGames';
import { cn } from '@/lib/utils';
import SlowConnectionBanner from '@/components/casino/SlowConnectionBanner';

// ─── Colour palette per line ─────────────────────────────────────────────────
const LINE_META = [
  { label: 'Linje 1', dot: 'bg-primary',      ring: 'border-primary',      glow: 'shadow-primary/40',      gradient: 'from-primary/25 to-primary/5',      track: 'hsl(var(--primary))' },
  { label: 'Linje 2', dot: 'bg-blue-500',      ring: 'border-blue-500',     glow: 'shadow-blue-500/40',     gradient: 'from-blue-500/25 to-blue-500/5',     track: 'hsl(217 91% 60%)' },
  { label: 'Linje 3', dot: 'bg-emerald-500',   ring: 'border-emerald-500',  glow: 'shadow-emerald-500/40',  gradient: 'from-emerald-500/25 to-emerald-500/5',track: 'hsl(160 84% 39%)' },
  { label: 'Linje 4', dot: 'bg-amber-400',     ring: 'border-amber-400',    glow: 'shadow-amber-400/40',    gradient: 'from-amber-400/25 to-amber-400/5',    track: 'hsl(43 96% 56%)' },
  { label: 'Linje 5', dot: 'bg-rose-500',      ring: 'border-rose-500',     glow: 'shadow-rose-500/40',     gradient: 'from-rose-500/25 to-rose-500/5',      track: 'hsl(0 84% 60%)' },
];

// ─── Roll display ─────────────────────────────────────────────────────────────
const RollDisplay = ({
  roll,
  isRolling,
  isWin,
  isLoss,
  targetNumber,
  isOver,
  lineIdx,
}: {
  roll: number | null;
  isRolling: boolean;
  isWin: boolean;
  isLoss: boolean;
  targetNumber: number;
  isOver: boolean;
  lineIdx: number;
}) => {
  const meta = LINE_META[lineIdx];
  return (
    <motion.div
      className={cn(
        'relative w-16 h-16 rounded-2xl border-2 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-300',
        isWin  ? `${meta.ring} shadow-lg ${meta.glow}` :
        isLoss ? 'border-destructive shadow-lg shadow-destructive/30' :
        'border-border/50 bg-muted/30'
      )}
    >
      {/* animated gradient bg */}
      <motion.div
        className={cn('absolute inset-0', isWin ? `bg-gradient-to-br ${meta.gradient}` : isLoss ? 'bg-destructive/10' : 'bg-transparent')}
        animate={isRolling ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
        transition={{ duration: 0.4, repeat: isRolling ? Infinity : 0 }}
      />
      {/* win pulse ring */}
      {isWin && (
        <motion.div
          className={cn('absolute inset-0 rounded-2xl border-2', meta.ring)}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
      <motion.span
        key={String(roll) + String(isRolling)}
        initial={{ scale: 0.7, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={cn(
          'relative z-10 text-xl font-heading font-bold tabular-nums',
          isWin  ? 'text-foreground' :
          isLoss ? 'text-destructive' :
          'text-muted-foreground'
        )}
      >
        {isRolling ? Math.floor(Math.random() * 100) + 1 : (roll ?? '–')}
      </motion.span>
    </motion.div>
  );
};

// ─── Single Line Card ─────────────────────────────────────────────────────────
interface LineCardProps {
  lineIdx: number;
  isActive: boolean;
  config: LineConfig;
  onChange: (cfg: LineConfig) => void;
  rollResult: { roll: number; isWin: boolean; multiplier: number } | null;
  isRolling: boolean;
  revealed: boolean;
}

const LineCard = ({ lineIdx, isActive, config, onChange, rollResult, isRolling, revealed }: LineCardProps) => {
  const meta = LINE_META[lineIdx];
  const winChance = config.isOver ? (99 - config.targetNumber) : (config.targetNumber - 1);
  const multiplier = calculateDiceMultiplier(winChance);
  const isWin = revealed && !!rollResult?.isWin;
  const isLoss = revealed && rollResult !== null && !rollResult.isWin;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: isActive ? 1 : 0.3,
        y: 0,
        scale: isActive ? 1 : 0.98,
      }}
      transition={{ delay: lineIdx * 0.05 }}
      className="relative"
    >
      <div
        className={cn(
          'rounded-2xl border bg-gradient-to-r p-4 transition-all duration-500',
          isActive ? `${meta.gradient} border-border/60` : 'from-muted/10 to-muted/5 border-border/20',
          isWin  && `shadow-xl ${meta.glow} border-opacity-100`,
          isLoss && 'border-destructive/40',
        )}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground', meta.dot)}>
              {lineIdx + 1}
            </div>
            <span className="text-xs font-semibold text-muted-foreground">{meta.label}</span>
          </div>

          {/* Win badge */}
          <AnimatePresence>
            {isWin && (
              <motion.div
                initial={{ scale: 0, x: 16 }}
                animate={{ scale: 1, x: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 border border-success/40"
              >
                <Trophy className="w-3 h-3 text-success" />
                <span className="text-xs font-bold text-success">x{rollResult!.multiplier.toFixed(2)}</span>
              </motion.div>
            )}
            {isLoss && (
              <motion.div
                initial={{ scale: 0, x: 16 }}
                animate={{ scale: 1, x: 0 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/30"
              >
                <span className="text-xs font-semibold text-destructive">Tabte</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3">
          {/* Roll result display */}
          <RollDisplay
            roll={rollResult?.roll ?? null}
            isRolling={isRolling && isActive}
            isWin={isWin}
            isLoss={isLoss}
            targetNumber={config.targetNumber}
            isOver={config.isOver}
            lineIdx={lineIdx}
          />

          {/* Controls */}
          <div className="flex-1 min-w-0">
            {/* Over/Under toggle */}
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <Button
                size="sm"
                variant={config.isOver ? 'default' : 'outline'}
                onClick={() => onChange({ ...config, isOver: true })}
                disabled={isRolling}
                className={cn(
                  'h-7 text-xs transition-all duration-200',
                  config.isOver && 'bg-success hover:bg-success/90 text-success-foreground shadow-md shadow-success/20'
                )}
              >
                <ArrowUp className="w-3 h-3 mr-1" />
                Over {config.targetNumber}
              </Button>
              <Button
                size="sm"
                variant={!config.isOver ? 'default' : 'outline'}
                onClick={() => onChange({ ...config, isOver: false })}
                disabled={isRolling}
                className={cn(
                  'h-7 text-xs transition-all duration-200',
                  !config.isOver && 'bg-accent hover:bg-accent/90 text-accent-foreground shadow-md shadow-accent/20'
                )}
              >
                <ArrowDown className="w-3 h-3 mr-1" />
                Under {config.targetNumber}
              </Button>
            </div>

            {/* Slider */}
            <Slider
              value={[config.targetNumber]}
              onValueChange={([v]) => onChange({ ...config, targetNumber: v })}
              min={2}
              max={98}
              step={1}
              disabled={isRolling || !isActive}
              className="mb-1"
            />

            {/* Stats row */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Chance: <span className={cn('font-semibold', winChance > 50 ? 'text-success' : winChance > 25 ? 'text-accent' : 'text-destructive')}>{winChance}%</span></span>
              <span>Multiplier: <span className="font-bold text-foreground">x{multiplier.toFixed(2)}</span></span>
            </div>
          </div>
        </div>

        {/* Win sweep shimmer */}
        <AnimatePresence>
          {isWin && (
            <motion.div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/12 to-transparent"
                initial={{ left: '-30%' }}
                animate={{ left: '130%' }}
                transition={{ duration: 0.8, delay: lineIdx * 0.08 + 0.3 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const DEFAULT_LINE: LineConfig = { targetNumber: 50, isOver: true };

const LinesGame = () => {
  const { data: balance, refetch: refetchBalance } = useShardBalance();
  const { spin } = usePlayLines();

  const [betAmount, setBetAmount] = useState(100);
  const [lineCount, setLineCount] = useState(1);
  const [lineConfigs, setLineConfigs] = useState<LineConfig[]>([
    { targetNumber: 50, isOver: true },
    { targetNumber: 50, isOver: true },
    { targetNumber: 50, isOver: true },
    { targetNumber: 50, isOver: true },
    { targetNumber: 50, isOver: true },
  ]);

  const [isSpinning, setIsSpinning] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<LinesSpinResponse | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [history, setHistory] = useState<{ net: number; mult: number }[]>([]);

  const totalBet = betAmount * lineCount;
  const canSpin = !isSpinning && totalBet <= (balance?.balance || 0) && betAmount >= 10;
  const formatShards = (n: number) => new Intl.NumberFormat('da-DK').format(n);

  // Combined multiplier shown before spin (product of active line multipliers)
  const previewCombinedMult = lineConfigs.slice(0, lineCount).reduce((acc, cfg) => {
    const wc = cfg.isOver ? 99 - cfg.targetNumber : cfg.targetNumber - 1;
    return acc * calculateDiceMultiplier(wc);
  }, 1);
  const previewPotentialWin = Math.floor(betAmount * Math.floor(previewCombinedMult * 100) / 100);

  const handleLineConfigChange = useCallback((idx: number, cfg: LineConfig) => {
    setLineConfigs(prev => prev.map((c, i) => i === idx ? cfg : c));
  }, []);

  const handleSpin = useCallback(async () => {
    if (!canSpin) return;

    setIsSpinning(true);
    setIsRolling(true);
    setRevealed(false);
    setResult(null);
    setShowCelebration(false);

    const MIN_ROLL_MS = 1800 + lineCount * 120;

    let data: LinesSpinResponse | null = null;
    try {
      [data] = await Promise.all([
        spin.mutateAsync({ betAmount, lineConfigs: lineConfigs.slice(0, lineCount) }),
        new Promise(r => setTimeout(r, MIN_ROLL_MS)),
      ]);
    } catch {
      setIsRolling(false);
      setIsSpinning(false);
      return;
    }

    // Brief pause so the tickers all show random on the same frame
    setIsRolling(false);
    await new Promise(r => setTimeout(r, 120));
    setResult(data!);
    setRevealed(true);

    if (data!.totalWin > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3500);
    }

    setHistory(prev => [{ net: data!.netResult, mult: data!.combinedMultiplier }, ...prev.slice(0, 14)]);
    refetchBalance();
    setIsSpinning(false);
  }, [canSpin, betAmount, lineCount, lineConfigs, spin, refetchBalance]);

  const bigWin = result && result.totalWin >= totalBet * 5;
  const quickBets = [50, 100, 500, 1000];

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 relative overflow-hidden">

      {/* Celebration particles */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div className="absolute inset-0 pointer-events-none z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[...Array(32)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ x: `${20 + Math.random() * 60}%`, y: '50%', scale: 0, opacity: 1 }}
                animate={{
                  x: `${5 + Math.random() * 90}%`,
                  y: `${Math.random() * 90}%`,
                  scale: [0, 2, 0.6],
                  opacity: [1, 1, 0],
                  rotate: Math.random() * 720 - 360,
                }}
                transition={{ duration: 2 + Math.random() * 1.2, delay: Math.random() * 0.5, ease: 'easeOut' }}
              >
                {['✨', '💫', '⭐', '🌟', '🎉'][Math.floor(Math.random() * 5)]}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big Win overlay */}
      <AnimatePresence>
        {bigWin && revealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 0.65, repeat: Infinity }}
              className="px-10 py-5 rounded-3xl bg-primary/90 backdrop-blur-sm border-2 border-primary shadow-2xl shadow-primary/50"
            >
              <div className="text-5xl mb-1">🏆</div>
              <div className="font-heading text-3xl text-primary-foreground">ALL WIN!</div>
              <div className="text-primary-foreground/80 font-bold text-xl mt-1">
                x{result!.combinedMultiplier.toFixed(2)} → +{formatShards(result!.totalWin)}
              </div>
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
            <p className="text-sm text-muted-foreground">Sæt din multiplier per linje</p>
          </div>
        </div>

        {/* History dots */}
        {history.length > 0 && (
          <div className="flex items-center gap-1">
            {history.slice(0, 10).map((h, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn('w-2 h-2 rounded-full', h.net >= 0 ? 'bg-success' : 'bg-destructive')}
                title={`${h.net >= 0 ? '+' : ''}${formatShards(h.net)}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_240px] gap-5">

        {/* LEFT: Line cards */}
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => {
            const lr = result?.lineResults[i];
            return (
              <LineCard
                key={i}
                lineIdx={i}
                isActive={i < lineCount}
                config={lineConfigs[i]}
                onChange={(cfg) => handleLineConfigChange(i, cfg)}
                rollResult={lr ? { roll: lr.roll, isWin: lr.isWin, multiplier: lr.multiplier } : null}
                isRolling={isRolling}
                revealed={revealed}
              />
            );
          })}

          {/* Result summary */}
          <AnimatePresence>
            {revealed && result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'rounded-xl p-3.5 border flex items-center justify-between',
                  result.totalWin > 0 ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'
                )}
              >
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {result.winningLinesCount > 0
                      ? `${result.winningLinesCount}/${lineCount} linjer vandt`
                      : 'Ingen gevinster'}
                  </div>
                  {result.winningLinesCount > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Kombineret: x{result.combinedMultiplier.toFixed(2)}
                    </div>
                  )}
                </div>
                <motion.div
                  initial={{ scale: 0.7 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className={cn('font-bold text-xl', result.netResult >= 0 ? 'text-success' : 'text-destructive')}
                >
                  {result.netResult >= 0 ? '+' : ''}{formatShards(result.netResult)}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Controls */}
        <div className="space-y-4 order-first lg:order-last">

          {/* Balance */}
          <div className="bg-background/60 rounded-xl p-3 flex items-center justify-between border border-border/40">
            <span className="text-sm text-muted-foreground">Saldo</span>
            <motion.span
              key={balance?.balance}
              initial={{ scale: 1.1, color: 'hsl(var(--success))' }}
              animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
              className="font-bold text-sm"
            >
              {formatShards(balance?.balance || 0)} ✨
            </motion.span>
          </div>

          {/* Line count */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Antal linjer</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="icon"
                onClick={() => setLineCount(c => Math.max(1, c - 1))}
                disabled={isSpinning || lineCount <= 1}
                className="w-9 h-9"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="flex-1 flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setLineCount(n)}
                    disabled={isSpinning}
                    className={cn(
                      'w-7 h-7 rounded-lg text-sm font-bold transition-all',
                      n <= lineCount
                        ? `${LINE_META[n - 1].dot} text-white shadow-md`
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <Button
                variant="outline" size="icon"
                onClick={() => setLineCount(c => Math.min(5, c + 1))}
                disabled={isSpinning || lineCount >= 5}
                className="w-9 h-9"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Bet per line */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Indsats pr. linje</label>
            <div className="flex gap-2 mb-2">
              <Input
                type="number"
                value={betAmount}
                onChange={e => setBetAmount(parseInt(e.target.value) || 0)}
                onBlur={() => setBetAmount(prev => Math.max(10, prev))}
                disabled={isSpinning}
                className="bg-background"
              />
              <Button variant="outline" size="sm" onClick={() => setBetAmount(b => Math.max(10, Math.floor(b / 2)))} disabled={isSpinning}>½</Button>
              <Button variant="outline" size="sm" onClick={() => setBetAmount(b => Math.min(b * 2, balance?.balance || 0))} disabled={isSpinning}>2×</Button>
            </div>
            <div className="flex gap-1.5">
              {quickBets.map(qb => (
                <Button key={qb} variant="ghost" size="sm" className="flex-1 text-xs h-8" onClick={() => setBetAmount(qb)} disabled={isSpinning || qb > (balance?.balance || 0)}>
                  {qb}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats preview */}
          <motion.div className="bg-background/60 rounded-xl p-3.5 space-y-2 border border-border/40" layout>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total indsats</span>
              <span className="font-semibold">{formatShards(totalBet)} ✨</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Max multiplier</span>
              <motion.span key={previewCombinedMult} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="font-semibold text-primary">
                x{(Math.floor(previewCombinedMult * 100) / 100).toFixed(2)}
              </motion.span>
            </div>
            <div className="flex justify-between text-sm border-t border-border/40 pt-2">
              <span className="text-muted-foreground">Maks gevinst</span>
              <motion.span key={previewPotentialWin} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="font-bold text-lg text-primary">
                {formatShards(previewPotentialWin)} ✨
              </motion.span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 text-center">Alle linjer skal vinde for maks gevinst</p>
          </motion.div>

          {/* Spin button */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              className={cn(
                'w-full h-14 text-base font-bold transition-all duration-300 relative overflow-hidden',
                canSpin
                  ? 'bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25'
                  : 'bg-muted'
              )}
              onClick={handleSpin}
              disabled={!canSpin}
            >
              {/* shimmer sweep */}
              {canSpin && !isSpinning && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                />
              )}
              {isSpinning ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ruller…
                </span>
              ) : (
                <span className="flex items-center gap-2 relative z-10">
                  <Zap className="w-5 h-5" />
                  Spin ({formatShards(totalBet)} ✨)
                </span>
              )}
            </Button>
          </motion.div>

          {/* Copy-all lines shortcut */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground gap-1.5"
            onClick={() => {
              const first = lineConfigs[0];
              setLineConfigs(prev => prev.map(() => ({ ...first })));
            }}
            disabled={isSpinning}
          >
            <RotateCcw className="w-3 h-3" />
            Kopier linje 1 til alle
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LinesGame;
