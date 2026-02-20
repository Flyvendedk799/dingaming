import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Loader2, Sparkles, RotateCcw, X, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShardBalance } from '@/hooks/useShards';
import { usePlayRoulette } from '@/hooks/useGames';
import { cn } from '@/lib/utils';

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];

type BetType = "number" | "red" | "black" | "odd" | "even" | "1-18" | "19-36" | "1st12" | "2nd12" | "3rd12";

interface Bet {
  type: BetType;
  value?: number;
  amount: number;
}

const isRed = (n: number) => RED_NUMBERS.includes(n);

const SLOT_ANGLE = 360 / 37;

const RouletteWheel = ({ rotation, result, isAnimating, resultIsRed }: { rotation: number; result: number | null; isAnimating: boolean; resultIsRed: boolean | null }) => {
  const segments = useMemo(() => {
    return WHEEL_ORDER.map((num, i) => {
      const angle = i * SLOT_ANGLE;
      const color = num === 0 ? '#0a7e2e' : isRed(num) ? '#c62828' : '#1a1a2e';
      return { num, angle, color };
    });
  }, []);

  return (
    <div className="relative w-52 h-52 sm:w-64 sm:h-64 mx-auto">
      {/* Outer ring glow */}
      <div className="absolute inset-0 rounded-full" style={{
        boxShadow: isAnimating
          ? '0 0 30px hsl(38 92% 50% / 0.4), inset 0 0 20px hsl(38 92% 50% / 0.1)'
          : '0 0 15px hsl(38 92% 50% / 0.15)',
        transition: 'box-shadow 0.5s ease'
      }} />

      {/* Spinning wheel */}
      <motion.div
        className="w-full h-full rounded-full border-[3px] border-border/50 overflow-hidden relative"
        animate={{ rotate: rotation }}
        transition={{ duration: 4.5, ease: [0.15, 0.85, 0.25, 1] }}
      >
        {/* SVG wheel */}
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {segments.map(({ num, angle, color }) => {
            const startAngle = (angle - SLOT_ANGLE / 2) * (Math.PI / 180);
            const endAngle = (angle + SLOT_ANGLE / 2) * (Math.PI / 180);
            const r = 100;
            const cx = 100, cy = 100;
            const x1 = cx + r * Math.cos(startAngle);
            const y1 = cy + r * Math.sin(startAngle);
            const x2 = cx + r * Math.cos(endAngle);
            const y2 = cy + r * Math.sin(endAngle);

            const textAngle = angle * (Math.PI / 180);
            const textR = 82;
            const tx = cx + textR * Math.cos(textAngle);
            const ty = cy + textR * Math.sin(textAngle);

            return (
              <g key={num}>
                <path
                  d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                  fill={color}
                  stroke="hsl(30 6% 18%)"
                  strokeWidth="0.3"
                />
                <text
                  x={tx}
                  y={ty}
                  fill="white"
                  fontSize="7"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${angle + 90}, ${tx}, ${ty})`}
                >
                  {num}
                </text>
              </g>
            );
          })}
          {/* Inner circle */}
          <circle cx="100" cy="100" r="38" fill="hsl(30 8% 10%)" stroke="hsl(30 6% 18%)" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="35" fill="hsl(30 10% 6%)" />
        </svg>
      </motion.div>

      {/* Center display */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            {result !== null ? (
              <motion.span
                key={`result-${result}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  'text-3xl sm:text-4xl font-heading font-bold drop-shadow-lg',
                  result === 0 ? 'text-emerald-400' : resultIsRed ? 'text-red-400' : 'text-foreground'
                )}
              >
                {result}
              </motion.span>
            ) : isAnimating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-6 h-6 text-primary" />
              </motion.div>
            ) : (
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Spin</span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Pointer triangle */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-primary drop-shadow-lg" />
      </div>
    </div>
  );
};

const RouletteGame = () => {
  const { data: balance, refetch: refetchBalance } = useShardBalance();
  const playRoulette = usePlayRoulette();

  const [chipAmount, setChipAmount] = useState(100);
  const [bets, setBets] = useState<Bet[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isWaitingForServer, setIsWaitingForServer] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [resultIsRed, setResultIsRed] = useState<boolean | null>(null);
  const [lastWin, setLastWin] = useState<number>(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [history, setHistory] = useState<number[]>([]);

  const totalBet = bets.reduce((s, b) => s + b.amount, 0);
  const isBusy = isSpinning || isAnimating;

  const addBet = (type: BetType, value?: number) => {
    if (isBusy || chipAmount < 10) return;
    setBets(prev => {
      const existing = prev.findIndex(b => b.type === type && b.value === value);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], amount: updated[existing].amount + chipAmount };
        return updated;
      }
      return [...prev, { type, value, amount: chipAmount }];
    });
  };

  const clearBets = () => { if (!isBusy) setBets([]); };

  const getBetOnNumber = (n: number): number =>
    bets.filter(b => b.type === 'number' && b.value === n).reduce((s, b) => s + b.amount, 0);
  const getBetOnType = (type: BetType): number =>
    bets.filter(b => b.type === type).reduce((s, b) => s + b.amount, 0);

  const handleSpin = async () => {
    if (isBusy || bets.length === 0 || totalBet > (balance?.balance || 0)) return;
    setResult(null);
    setLastWin(0);
    setIsAnimating(true);

    // Kick wheel spinning IMMEDIATELY with a placeholder rotation
    // so the user sees it moving right away regardless of server speed.
    const PRE_SPIN_ROTATIONS = 360 * 4; // 4 full rotations as a "pending" spin
    setWheelRotation(prev => prev + PRE_SPIN_ROTATIONS);

    // Minimum time we want the wheel to visibly spin before revealing result
    const MIN_SPIN_MS = 4800;

    try {
      // API call and minimum wait run in parallel
      const [data] = await Promise.all([
        playRoulette.mutateAsync({ bets }),
        new Promise(r => setTimeout(r, MIN_SPIN_MS)),
      ]);

      // Both done — now apply the corrected final position
      const resultIndex = WHEEL_ORDER.indexOf(data.result);
      // Add extra rotations on top of current to land on result
      const targetDeg = 360 * 4 + (360 - resultIndex * SLOT_ANGLE);
      setWheelRotation(prev => prev + targetDeg);

      // Wait for this final spin CSS transition
      await new Promise(r => setTimeout(r, MIN_SPIN_MS));

      setResult(data.result);
      setResultIsRed(data.isRed);
      setLastWin(data.totalWin);
      setHistory(prev => [data.result, ...prev.slice(0, 19)]);

      if (data.totalWin > 0) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2500);
      }

      refetchBalance();
    } catch {
      // no-op
    } finally {
      setIsAnimating(false);
      setIsSpinning(false);
    }
  };

  const handleNewRound = () => {
    setResult(null);
    setLastWin(0);
    setBets([]);
  };

  const formatShards = (s: number) => new Intl.NumberFormat('da-DK').format(s);

  const quickChips = [50, 100, 500, 1000];

  // Board: numbers 1-36 in 12 rows × 3 cols
  const boardRows: number[][] = [];
  for (let row = 0; row < 12; row++) {
    boardRows.push([row * 3 + 1, row * 3 + 2, row * 3 + 3]);
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 relative overflow-hidden">
      {/* Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div className="absolute inset-0 pointer-events-none z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ x: '50%', y: '40%', scale: 0, opacity: 1 }}
                animate={{ x: `${15 + Math.random() * 70}%`, y: `${Math.random() * 80}%`, scale: [0, 1.3, 0.7], opacity: [1, 1, 0], rotate: Math.random() * 720 }}
                transition={{ duration: 1.5, delay: Math.random() * 0.3, ease: 'easeOut' }}
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <span className="text-xl">🎰</span>
        </div>
        <div>
          <h2 className="font-heading text-xl text-foreground">Roulette</h2>
          <p className="text-sm text-muted-foreground">Europæisk roulette – placer chips og spin!</p>
        </div>
      </div>

      {/* Main layout: stacked on mobile, side-by-side on desktop */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left column: wheel + controls */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Balance */}
          <div className="bg-background/50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Din saldo</span>
            <motion.span key={balance?.balance} initial={{ scale: 1.1, color: 'hsl(var(--success))' }} animate={{ scale: 1, color: 'hsl(var(--foreground))' }} className="font-bold text-lg">
              {formatShards(balance?.balance || 0)} Shards
            </motion.span>
          </div>

          {/* Wheel */}
          <div className="py-2">
            <RouletteWheel rotation={wheelRotation} result={result} isAnimating={isAnimating} resultIsRed={resultIsRed} />
          </div>

          {/* Result banner */}
          <AnimatePresence>
            {result !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'text-center py-3 rounded-xl font-heading text-lg',
                  lastWin > 0 ? 'bg-success/10 text-success border border-success/30' : 'bg-destructive/10 text-destructive border border-destructive/30'
                )}
              >
                {lastWin > 0 ? `🎉 Vandt ${formatShards(lastWin)} Shards!` : `💀 Tabt – ${result} ${result === 0 ? '(grøn)' : resultIsRed ? '(rød)' : '(sort)'}`}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chip selector */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Chip størrelse</label>
            <div className="flex gap-2">
              {quickChips.map(c => (
                <Button
                  key={c}
                  variant={chipAmount === c ? "default" : "outline"}
                  size="sm"
                  className={cn("flex-1 text-xs sm:text-sm", chipAmount === c && "bg-primary")}
                  onClick={() => setChipAmount(c)}
                  disabled={isBusy}
                >
                  {c}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setChipAmount(prev => Math.max(10, prev - 50))} disabled={isBusy || chipAmount <= 10}>
                <Minus className="w-4 h-4" />
              </Button>
              <div className="flex-1 text-center font-semibold text-foreground bg-background rounded-lg py-2">{formatShards(chipAmount)}</div>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setChipAmount(prev => prev + 50)} disabled={isBusy}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Bet info */}
          {bets.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-background rounded-xl p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Total indsats</span>
                <span className="font-semibold">{formatShards(totalBet)} Shards</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{bets.length} bet{bets.length > 1 ? 's' : ''}</span>
                <button onClick={clearBets} className="text-destructive hover:underline flex items-center gap-1" disabled={isBusy}>
                  <X className="w-3 h-3" /> Ryd
                </button>
              </div>
            </motion.div>
          )}

          {/* Spin / New round */}
          <motion.div whileTap={{ scale: 0.98 }}>
            {result !== null ? (
              <Button className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={handleNewRound}>
                <RotateCcw className="w-5 h-5 mr-2" /> Ny runde
              </Button>
            ) : (
              <Button
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                onClick={handleSpin}
                disabled={isBusy || bets.length === 0 || totalBet > (balance?.balance || 0)}
              >
                {isSpinning ? <Loader2 className="w-5 h-5 animate-spin" /> : isAnimating ? (
                  <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity }}>Spinner...</motion.span>
                ) : (
                  <><Zap className="w-5 h-5 mr-2" />Spin ({formatShards(totalBet)} Shards)</>
                )}
              </Button>
            )}
          </motion.div>

          {/* History */}
          {history.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Historik</label>
              <div className="flex gap-1 flex-wrap">
                {history.map((h, i) => (
                  <motion.span
                    key={`${i}-${h}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      'w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white',
                      h === 0 ? 'bg-emerald-600' : isRed(h) ? 'bg-red-600' : 'bg-zinc-800'
                    )}
                  >
                    {h}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Betting board */}
        <div className="xl:w-[280px] shrink-0 space-y-3">
          <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Betting Board</label>

          {/* Number grid */}
          <div className="rounded-xl overflow-hidden border border-border">
            {/* Zero */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => addBet('number', 0)}
              disabled={isBusy}
              className={cn(
                'w-full h-10 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold relative transition-all',
                getBetOnNumber(0) > 0 && 'ring-2 ring-inset ring-primary'
              )}
            >
              0
              {getBetOnNumber(0) > 0 && (
                <span className="absolute top-1 right-2 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">{formatShards(getBetOnNumber(0))}</span>
              )}
            </motion.button>

            {/* Numbers 1-36 */}
            <div className="grid grid-cols-3">
              {boardRows.map(row => row.map(n => (
                <motion.button
                  key={n}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => addBet('number', n)}
                  disabled={isBusy}
                  className={cn(
                    'h-10 text-sm font-bold text-white relative transition-all border-t border-border/30',
                    isRed(n) ? 'bg-red-700 hover:bg-red-600' : 'bg-zinc-800 hover:bg-zinc-700',
                    getBetOnNumber(n) > 0 && 'ring-2 ring-inset ring-primary',
                    // Highlight result number
                    result === n && 'ring-2 ring-inset ring-primary animate-pulse'
                  )}
                >
                  {n}
                  {getBetOnNumber(n) > 0 && (
                    <span className="absolute -top-1 -right-1 text-[7px] bg-primary text-primary-foreground w-4 h-4 rounded-full flex items-center justify-center font-bold z-10">✓</span>
                  )}
                </motion.button>
              )))}
            </div>
          </div>

          {/* Dozens */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: '1st 12', type: '1st12' as BetType },
              { label: '2nd 12', type: '2nd12' as BetType },
              { label: '3rd 12', type: '3rd12' as BetType },
            ].map(b => (
              <motion.button
                key={b.type}
                whileTap={{ scale: 0.92 }}
                onClick={() => addBet(b.type)}
                disabled={isBusy}
                className={cn(
                  'h-9 rounded-lg bg-muted hover:bg-muted/70 text-foreground text-xs font-semibold transition-all border border-border/50',
                  getBetOnType(b.type) > 0 && 'ring-2 ring-primary bg-primary/10'
                )}
              >
                {b.label}
              </motion.button>
            ))}
          </div>

          {/* Outside bets */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: '🔴 Rød', type: 'red' as BetType, cls: 'bg-red-700/80 hover:bg-red-600 text-white border-red-600/50' },
              { label: '⚫ Sort', type: 'black' as BetType, cls: 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700/50' },
              { label: 'Ulige', type: 'odd' as BetType, cls: 'bg-muted hover:bg-muted/70 text-foreground border-border/50' },
              { label: 'Lige', type: 'even' as BetType, cls: 'bg-muted hover:bg-muted/70 text-foreground border-border/50' },
              { label: '1-18', type: '1-18' as BetType, cls: 'bg-muted hover:bg-muted/70 text-foreground border-border/50' },
              { label: '19-36', type: '19-36' as BetType, cls: 'bg-muted hover:bg-muted/70 text-foreground border-border/50' },
            ].map(b => (
              <motion.button
                key={b.type}
                whileTap={{ scale: 0.92 }}
                onClick={() => addBet(b.type)}
                disabled={isBusy}
                className={cn(
                  'h-10 rounded-lg text-xs font-semibold transition-all border',
                  b.cls,
                  getBetOnType(b.type) > 0 && 'ring-2 ring-primary'
                )}
              >
                {b.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouletteGame;
