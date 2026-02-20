import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Loader2, Sparkles, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const RouletteGame = () => {
  const { data: balance, refetch: refetchBalance } = useShardBalance();
  const playRoulette = usePlayRoulette();

  const [chipAmount, setChipAmount] = useState(100);
  const [bets, setBets] = useState<Bet[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
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

  const clearBets = () => {
    if (isBusy) return;
    setBets([]);
  };

  const getBetOnNumber = (n: number): number => {
    return bets.filter(b => b.type === 'number' && b.value === n).reduce((s, b) => s + b.amount, 0);
  };

  const getBetOnType = (type: BetType): number => {
    return bets.filter(b => b.type === type).reduce((s, b) => s + b.amount, 0);
  };

  const handleSpin = async () => {
    if (isBusy || bets.length === 0 || totalBet > (balance?.balance || 0)) return;
    setIsSpinning(true);
    setResult(null);
    setLastWin(0);

    try {
      const data = await playRoulette.mutateAsync({ bets });

      // Animate the wheel
      setIsAnimating(true);
      setIsSpinning(false);

      const resultIndex = WHEEL_ORDER.indexOf(data.result);
      const degreesPerSlot = 360 / 37;
      const targetDeg = 360 * 5 + (360 - resultIndex * degreesPerSlot); // 5 full spins + landing
      setWheelRotation(prev => prev + targetDeg);

      // Wait for wheel animation
      await new Promise(r => setTimeout(r, 4000));

      setResult(data.result);
      setResultIsRed(data.isRed);
      setLastWin(data.totalWin);
      setHistory(prev => [data.result, ...prev.slice(0, 19)]);

      if (data.totalWin > 0) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2500);
      }

      refetchBalance();
      setIsAnimating(false);
    } catch {
      setIsSpinning(false);
      setIsAnimating(false);
    }
  };

  const handleNewRound = () => {
    setResult(null);
    setLastWin(0);
    setBets([]);
  };

  const formatShards = (s: number) => new Intl.NumberFormat('da-DK').format(s);

  const quickChips = [50, 100, 500, 1000];

  // Board layout - 3 columns × 12 rows
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
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ x: '50%', y: '40%', scale: 0, opacity: 1 }}
                animate={{ x: `${20 + Math.random() * 60}%`, y: `${Math.random() * 80}%`, scale: [0, 1.2, 0.8], opacity: [1, 1, 0], rotate: Math.random() * 360 }}
                transition={{ duration: 1.2, delay: Math.random() * 0.2, ease: 'easeOut' }}
              >
                <Sparkles className="w-4 h-4 text-success" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <span className="text-xl">🎰</span>
        </div>
        <div>
          <h2 className="font-heading text-xl text-foreground">Roulette</h2>
          <p className="text-sm text-muted-foreground">Placer dine chips og spin hjulet!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-6">
        {/* Left: Wheel + Controls */}
        <div className="space-y-4">
          {/* Balance */}
          <div className="bg-background/50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Din saldo</span>
            <motion.span key={balance?.balance} initial={{ scale: 1.1, color: 'hsl(var(--success))' }} animate={{ scale: 1, color: 'hsl(var(--foreground))' }} className="font-bold text-lg">
              {formatShards(balance?.balance || 0)} Shards
            </motion.span>
          </div>

          {/* Wheel visualization */}
          <div className="flex justify-center py-4">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56">
              {/* Wheel */}
              <motion.div
                className="w-full h-full rounded-full border-4 border-border relative overflow-hidden"
                style={{ background: 'conic-gradient(from 0deg, #1a1a2e 0deg, #c62828 9.73deg, #1a1a2e 19.46deg, #c62828 29.19deg, #1a1a2e 38.92deg, #c62828 48.65deg, #1a1a2e 58.38deg, #c62828 68.11deg, #1a1a2e 77.84deg, #c62828 87.57deg, #1a1a2e 97.30deg, #c62828 107.03deg, #1a1a2e 116.76deg, #c62828 126.49deg, #1a1a2e 136.22deg, #c62828 145.95deg, #1a1a2e 155.68deg, #c62828 165.41deg, #0a5e1e 175.14deg, #c62828 184.87deg, #1a1a2e 194.59deg, #c62828 204.32deg, #1a1a2e 214.05deg, #c62828 223.78deg, #1a1a2e 233.51deg, #c62828 243.24deg, #1a1a2e 252.97deg, #c62828 262.70deg, #1a1a2e 272.43deg, #c62828 282.16deg, #1a1a2e 291.89deg, #c62828 301.62deg, #1a1a2e 311.35deg, #c62828 321.08deg, #1a1a2e 330.81deg, #c62828 340.54deg, #1a1a2e 350.27deg)' }}
                animate={{ rotate: wheelRotation }}
                transition={{ duration: 4, ease: [0.12, 0.8, 0.3, 1] }}
              >
                <div className="absolute inset-[20%] rounded-full bg-card border-2 border-border flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {result !== null ? (
                      <motion.span
                        key={result}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={cn(
                          'text-3xl font-heading font-bold',
                          result === 0 ? 'text-emerald-400' : resultIsRed ? 'text-red-400' : 'text-foreground'
                        )}
                      >
                        {result}
                      </motion.span>
                    ) : isAnimating ? (
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity }} className="text-xl text-muted-foreground">
                        ●
                      </motion.span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Spin</span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-4 h-6 z-10">
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-primary" />
              </div>
            </div>
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
                  className={cn("flex-1", chipAmount === c && "bg-primary")}
                  onClick={() => setChipAmount(c)}
                  disabled={isBusy}
                >
                  {c}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                type="number"
                value={chipAmount}
                onChange={(e) => setChipAmount(parseInt(e.target.value) || 0)}
                onBlur={() => setChipAmount(prev => Math.max(10, prev))}
                className="bg-background"
                disabled={isBusy}
              />
            </div>
          </div>

          {/* Bet info + actions */}
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

          {/* Spin / New round button */}
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

        {/* Right: Betting board */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Klik for at placere chips</label>

          {/* Number grid */}
          <div className="grid grid-cols-3 gap-0.5 max-w-[220px]">
            {/* Zero */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => addBet('number', 0)}
              disabled={isBusy}
              className={cn(
                'col-span-3 h-10 rounded-t-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold relative transition-colors',
                getBetOnNumber(0) > 0 && 'ring-2 ring-primary'
              )}
            >
              0
              {getBetOnNumber(0) > 0 && <span className="absolute top-0.5 right-1 text-[9px] bg-primary text-primary-foreground px-1 rounded">{getBetOnNumber(0)}</span>}
            </motion.button>

            {/* Numbers 1-36 */}
            {boardRows.map(row => row.map(n => (
              <motion.button
                key={n}
                whileTap={{ scale: 0.9 }}
                onClick={() => addBet('number', n)}
                disabled={isBusy}
                className={cn(
                  'h-9 text-xs font-bold text-white relative transition-colors',
                  isRed(n) ? 'bg-red-700 hover:bg-red-600' : 'bg-zinc-800 hover:bg-zinc-700',
                  getBetOnNumber(n) > 0 && 'ring-2 ring-primary'
                )}
              >
                {n}
                {getBetOnNumber(n) > 0 && <span className="absolute -top-1 -right-1 text-[8px] bg-primary text-primary-foreground w-4 h-4 rounded-full flex items-center justify-center">{getBetOnNumber(n)}</span>}
              </motion.button>
            )))}
          </div>

          {/* Outside bets */}
          <div className="grid grid-cols-3 gap-1 max-w-[220px]">
            {[
              { label: '1st 12', type: '1st12' as BetType },
              { label: '2nd 12', type: '2nd12' as BetType },
              { label: '3rd 12', type: '3rd12' as BetType },
            ].map(b => (
              <motion.button
                key={b.type}
                whileTap={{ scale: 0.9 }}
                onClick={() => addBet(b.type)}
                disabled={isBusy}
                className={cn(
                  'h-8 rounded-md bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors',
                  getBetOnType(b.type) > 0 && 'ring-2 ring-primary'
                )}
              >
                {b.label}
              </motion.button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1 max-w-[220px]">
            {[
              { label: '🔴 Rød', type: 'red' as BetType, cls: 'bg-red-700 hover:bg-red-600 text-white' },
              { label: '⚫ Sort', type: 'black' as BetType, cls: 'bg-zinc-800 hover:bg-zinc-700 text-white' },
              { label: 'Ulige', type: 'odd' as BetType, cls: 'bg-muted hover:bg-muted/80 text-foreground' },
              { label: 'Lige', type: 'even' as BetType, cls: 'bg-muted hover:bg-muted/80 text-foreground' },
              { label: '1-18', type: '1-18' as BetType, cls: 'bg-muted hover:bg-muted/80 text-foreground' },
              { label: '19-36', type: '19-36' as BetType, cls: 'bg-muted hover:bg-muted/80 text-foreground' },
            ].map(b => (
              <motion.button
                key={b.type}
                whileTap={{ scale: 0.9 }}
                onClick={() => addBet(b.type)}
                disabled={isBusy}
                className={cn(
                  'h-9 rounded-md text-xs font-semibold transition-colors',
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
