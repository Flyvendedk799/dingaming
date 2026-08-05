import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Loader2, Sparkles, Trophy, RotateCcw, Hand, Square, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useShardBalance } from '@/hooks/useShards';
import { usePlayBlackjack, useActiveGameSession } from '@/hooks/useGames';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlowConnectionBanner from '@/components/casino/SlowConnectionBanner';
import WMark from "@/components/WMark";

interface Card {
  suit: string;
  rank: string;
  value: number;
}

const suitColor = (suit: string) => {
  return suit === '♥' || suit === '♦' ? 'text-red-400' : 'text-foreground';
};

// Stable key for hole card so React can track the flip animation correctly
const HOLE_CARD_KEY = 'dealer-hole-card';

const PlayingCard = ({
  card,
  index,
  hidden = false,
  delay = 0,
  flipReveal = false,
  cardKey,
}: {
  card: Card;
  index: number;
  hidden?: boolean;
  delay?: number;
  flipReveal?: boolean;
  cardKey?: string;
}) => (
  <motion.div
    key={cardKey}
    initial={
      flipReveal
        ? { rotateY: 180, scale: 0.88, z: 40 }
        : { opacity: 0, y: -70, x: 20, rotate: -10, scale: 0.65 }
    }
    animate={
      flipReveal
        ? { rotateY: 0, scale: 1, z: 0 }
        : { opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }
    }
    transition={
      flipReveal
        ? { delay, duration: 0.55, type: 'spring', stiffness: 180, damping: 20 }
        : { delay, duration: 0.45, type: 'spring', stiffness: 260, damping: 24 }
    }
    className={cn(
      'relative w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 flex flex-col items-center justify-center font-bold shadow-xl select-none flex-shrink-0',
      hidden
        ? 'bg-gradient-to-br from-primary/70 to-primary border-primary/40'
        : 'bg-card border-border'
    )}
    style={{
      marginLeft: index > 0 ? '-18px' : '0',
      zIndex: index + 1,
      transformStyle: 'preserve-3d',
    }}
  >
    {hidden ? (
      <div className="text-primary-foreground/60 text-3xl select-none">?</div>
    ) : (
      <>
        <span className={cn('text-xs absolute top-1.5 left-2 font-bold', suitColor(card.suit))}>
          {card.rank}
        </span>
        <span className={cn('text-2xl sm:text-3xl', suitColor(card.suit))}>{card.suit}</span>
        <span className={cn('text-xs absolute bottom-1.5 right-2 rotate-180 font-bold', suitColor(card.suit))}>
          {card.rank}
        </span>
      </>
    )}
  </motion.div>
);

const MIN_DEAL_ANIM_MS = 1400;
const MIN_ACTION_ANIM_MS = 800;
const MIN_STAND_ANIM_MS = 2200; // minimum before dealer reveal starts

const BlackjackGame = () => {
  const { data: balance, refetch: refetchBalance } = useShardBalance();
  const { data: activeSession, isLoading: loadingSession } = useActiveGameSession('blackjack');
  const playBlackjack = usePlayBlackjack();

  const [betAmount, setBetAmount] = useState(100);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [playerValue, setPlayerValue] = useState(0);
  const [dealerValue, setDealerValue] = useState(0);
  const [status, setStatus] = useState<string>('idle');
  const [winAmount, setWinAmount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  // Track which dealer card index is being flip-revealed
  const [flipRevealIndex, setFlipRevealIndex] = useState<number | null>(null);
  // Round counter so card keys are unique across hands
  const roundRef = useRef(0);
  const hasRestored = useRef(false);

  const isPlaying = status === 'playing';
  const isGameOver = ['player_bust', 'dealer_bust', 'player_win', 'dealer_win', 'push', 'blackjack'].includes(status);
  const isBusy = isActing || isAnimating;

  // ---------- Session restore ----------
  useEffect(() => {
    if (activeSession && !hasRestored.current && !sessionId) {
      hasRestored.current = true;
      const s = activeSession.state as any;
      roundRef.current += 1;
      setSessionId(activeSession.session_id);
      setPlayerHand(s.playerHand || []);
      setDealerHand(s.dealerHand ? [s.dealerHand[0]] : []);
      setPlayerValue(handValueCalc(s.playerHand || []));
      setDealerValue(s.dealerHand?.[0]?.value || 0);
      setBetAmount(s.betAmount || 100);
      setStatus(s.status || 'playing');
      toast.info('Aktivt spil gendannet');
    }
  }, [activeSession, sessionId]);

  // ---------- Celebration ----------
  useEffect(() => {
    if (isGameOver && winAmount > 0) {
      setShowCelebration(true);
      const t = setTimeout(() => setShowCelebration(false), 2800);
      return () => clearTimeout(t);
    }
  }, [isGameOver, winAmount]);

  function handValueCalc(cards: Card[]): number {
    let total = cards.reduce((s, c) => s + c.value, 0);
    let aces = cards.filter(c => c.rank === 'A').length;
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
  }

  const resetGame = useCallback(() => {
    setSessionId(null);
    setPlayerHand([]);
    setDealerHand([]);
    setPlayerValue(0);
    setDealerValue(0);
    setStatus('idle');
    setWinAmount(0);
    setShowCelebration(false);
    setIsAnimating(false);
    setFlipRevealIndex(null);
    hasRestored.current = false;
  }, []);

  // ---------- Dealer reveal animation ----------
  const animateDealerReveal = useCallback(async (
    fullDealerHand: Card[],
    finalStatus: string,
    finalWinAmount: number,
    finalPlayerValue: number,
    finalDealerValue: number,
  ) => {
    setIsAnimating(true);

    // Short suspense pause
    await new Promise(r => setTimeout(r, 400));

    // Flip the hole card (index 1)
    setFlipRevealIndex(1);
    setDealerHand([fullDealerHand[0], fullDealerHand[1]]);
    setDealerValue(handValueCalc(fullDealerHand.slice(0, 2)));
    await new Promise(r => setTimeout(r, 850));
    setFlipRevealIndex(null);

    // Draw extra dealer cards one by one
    for (let i = 2; i < fullDealerHand.length; i++) {
      await new Promise(r => setTimeout(r, 280));
      setDealerHand(fullDealerHand.slice(0, i + 1));
      setDealerValue(handValueCalc(fullDealerHand.slice(0, i + 1)));
      await new Promise(r => setTimeout(r, 750));
    }

    // Final suspense before result
    await new Promise(r => setTimeout(r, 500));

    setPlayerValue(finalPlayerValue);
    setDealerValue(finalDealerValue);
    setStatus(finalStatus);
    setWinAmount(finalWinAmount);
    setIsAnimating(false);
    refetchBalance();
  }, [refetchBalance]);

  // ---------- DEAL ----------
  const handleDeal = async () => {
    if (isBusy || betAmount < 10 || betAmount > (balance?.balance || 0)) return;
    setIsActing(true);
    roundRef.current += 1;
    resetGame();

    try {
      const [result] = await Promise.all([
        playBlackjack.mutateAsync({ action: 'deal', betAmount }),
        new Promise(r => setTimeout(r, MIN_DEAL_ANIM_MS)),
      ]);

      // Staggered deal: P → D → P → D (like a real table)
      setPlayerHand([result.playerHand[0]]);
      await new Promise(r => setTimeout(r, 300));
      setDealerHand([result.dealerHand[0]]);
      await new Promise(r => setTimeout(r, 300));
      setPlayerHand(result.playerHand);
      setPlayerValue(result.playerValue);
      await new Promise(r => setTimeout(r, 300));
      // Hole card appears face-down (rendered via isPlaying + dealerHand.length === 1)
      setDealerValue(result.dealerValue);
      setSessionId(result.sessionId);

      if (result.status !== 'playing') {
        // Blackjack or immediate resolution – reveal dealer straight away
        await new Promise(r => setTimeout(r, 200));
        setIsActing(false);
        await animateDealerReveal(
          result.dealerHand,
          result.status,
          result.winAmount || 0,
          result.playerValue,
          result.dealerValue,
        );
      } else {
        setStatus(result.status);
        setWinAmount(result.winAmount || 0);
        setIsActing(false);
      }

      refetchBalance();
    } catch {
      setIsActing(false);
    }
  };

  // ---------- HIT ----------
  const handleHit = async () => {
    if (!sessionId || isBusy || !isPlaying) return;
    setIsActing(true);

    try {
      const [result] = await Promise.all([
        playBlackjack.mutateAsync({ action: 'hit', sessionId }),
        new Promise(r => setTimeout(r, MIN_ACTION_ANIM_MS)),
      ]);

      setPlayerHand(result.playerHand);
      setPlayerValue(result.playerValue);

      if (result.status === 'playing') {
        setDealerHand(result.dealerHand);
        setDealerValue(result.dealerValue);
        setIsActing(false);
      } else {
        setIsActing(false);
        await animateDealerReveal(
          result.dealerHand,
          result.status,
          result.winAmount || 0,
          result.playerValue,
          result.dealerValue,
        );
      }
    } catch {
      setIsActing(false);
    }
  };

  // ---------- STAND ----------
  const handleStand = async () => {
    if (!sessionId || isBusy || !isPlaying) return;
    setIsActing(true);

    try {
      const [result] = await Promise.all([
        playBlackjack.mutateAsync({ action: 'stand', sessionId }),
        new Promise(r => setTimeout(r, MIN_STAND_ANIM_MS)),
      ]);

      setPlayerHand(result.playerHand);
      setIsActing(false);
      await animateDealerReveal(
        result.dealerHand,
        result.status,
        result.winAmount || 0,
        result.playerValue,
        result.dealerValue,
      );
    } catch {
      setIsActing(false);
    }
  };

  // ---------- DOUBLE DOWN ----------
  const handleDouble = async () => {
    if (!sessionId || isBusy || !isPlaying) return;
    if (betAmount > (balance?.balance || 0)) {
      toast.error('Ikke nok shards til at double');
      return;
    }
    setIsActing(true);

    try {
      const [result] = await Promise.all([
        playBlackjack.mutateAsync({ action: 'double', sessionId }),
        new Promise(r => setTimeout(r, MIN_STAND_ANIM_MS)),
      ]);

      setPlayerHand(result.playerHand);
      setPlayerValue(result.playerValue);
      setBetAmount(result.betAmount || betAmount * 2);
      setIsActing(false);
      await animateDealerReveal(
        result.dealerHand,
        result.status,
        result.winAmount || 0,
        result.playerValue,
        result.dealerValue,
      );
    } catch {
      setIsActing(false);
    }
  };

  const formatShards = (s: number) => new Intl.NumberFormat('da-DK').format(s);
  const quickBets = [100, 500, 1000, 5000];

  const getStatusText = () => {
    switch (status) {
      case 'blackjack':   return '🃏 BLACKJACK!';
      case 'player_win':  return '🎉 Du vandt!';
      case 'dealer_bust': return '💥 Dealer bust!';
      case 'player_bust': return '💀 Bust!';
      case 'dealer_win':  return '😞 Dealer vinder';
      case 'push':        return '🤝 Push (uafgjort)';
      default:            return '';
    }
  };

  const canDouble = isPlaying && playerHand.length === 2 && !isBusy && betAmount <= (balance?.balance || 0);

  if (loadingSession) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center h-64">
        <WMark size={40} motion="loop" label="Indlæser" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 relative overflow-hidden">

      {/* Celebration particles */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(18)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ x: '50%', y: '40%', scale: 0, opacity: 1 }}
                animate={{
                  x: `${15 + Math.random() * 70}%`,
                  y: `${5 + Math.random() * 80}%`,
                  scale: [0, 1.3, 0.7],
                  opacity: [1, 1, 0],
                  rotate: Math.random() * 400 - 200,
                }}
                transition={{ duration: 1.4, delay: Math.random() * 0.3, ease: 'easeOut' }}
              >
                <Sparkles className="w-4 h-4 text-success" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <span className="text-xl">🃏</span>
        </div>
        <div>
          <h2 className="font-heading text-xl text-foreground">Blackjack</h2>
          <p className="text-sm text-muted-foreground">Slå dealeren med 21 uden at gå bust!</p>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">

        {/* ── Controls ── */}
        <div className="space-y-4">

          {/* Balance */}
          <div className="bg-background/50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Din saldo</span>
            <motion.span
              key={balance?.balance}
              initial={{ scale: 1.12, color: 'hsl(var(--success))' }}
              animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
              className="font-bold text-lg"
            >
              {formatShards(balance?.balance || 0)} Shards
            </motion.span>
          </div>

          {/* Slow connection banner */}
          <SlowConnectionBanner visible={isActing} delayMs={2500} />

          {/* Bet controls (only when idle/game over) */}
          {!isPlaying && !isAnimating && (
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount(Math.floor(betAmount / 2))}
                  disabled={betAmount < 20}
                >½</Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount(Math.min(betAmount * 2, balance?.balance || 0))}
                >2×</Button>
              </div>
              <div className="flex gap-2 mt-2">
                {quickBets.map(qb => (
                  <Button
                    key={qb}
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setBetAmount(qb)}
                    disabled={qb > (balance?.balance || 0)}
                  >
                    {qb}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Game info during play */}
          {(isPlaying || isGameOver || isAnimating) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background rounded-xl p-4 space-y-2"
            >
              <div className="flex justify-between">
                <span className="text-muted-foreground">Indsats</span>
                <span className="font-semibold text-foreground">{formatShards(betAmount)}</span>
              </div>
              {isGameOver && (
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">Gevinst</span>
                  <motion.span
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className={cn('font-bold text-lg', winAmount > 0 ? 'text-success' : 'text-destructive')}
                  >
                    {winAmount > 0 ? `+${formatShards(winAmount)}` : '0'}
                  </motion.span>
                </div>
              )}
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {(status === 'idle' || isGameOver) && !isAnimating ? (
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  onClick={handleDeal}
                  disabled={isBusy || betAmount > (balance?.balance || 0) || betAmount < 10}
                >
                  {isActing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isGameOver ? (
                    <><RotateCcw className="w-5 h-5 mr-2" />Nyt spil ({formatShards(betAmount)} Shards)</>
                  ) : (
                    <><Zap className="w-5 h-5 mr-2" />Deal ({formatShards(betAmount)} Shards)</>
                  )}
                </Button>
              </motion.div>
            ) : isPlaying ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                      className="w-full h-14 sm:h-12 text-lg sm:text-base font-semibold bg-success hover:bg-success/90"
                      onClick={handleHit}
                      disabled={isBusy}
                    >
                      {isActing
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><Hand className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />Hit</>}
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                      className="w-full h-14 sm:h-12 text-lg sm:text-base font-semibold bg-accent hover:bg-accent/90"
                      onClick={handleStand}
                      disabled={isBusy}
                    >
                      {isActing
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><Square className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />Stand</>}
                    </Button>
                  </motion.div>
                </div>
                {/* Double Down – only available on first two cards */}
                <AnimatePresence>
                  {canDouble && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-11 text-sm font-semibold border-primary/40 text-primary hover:bg-primary/10"
                        onClick={handleDouble}
                        disabled={isBusy}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Double Down ({formatShards(betAmount)} extra)
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : isAnimating ? (
              <div className="text-center py-3">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <motion.div
                    className="flex gap-1"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                  >
                    <span className="text-lg">🃏</span>
                    <span className="text-lg">🃏</span>
                    <span className="text-lg">🃏</span>
                  </motion.div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Dealer trækker kort...
                  </p>
                </motion.div>
              </div>
            ) : null}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="flex flex-col items-center justify-center min-h-[260px] sm:min-h-[320px] order-first lg:order-last">
          {status === 'idle' && !isAnimating ? (
            <div className="text-center text-muted-foreground">
              <span className="text-6xl mb-4 block">🃏</span>
              <p className="text-lg font-medium">Placer din indsats og tryk Deal</p>
            </div>
          ) : (
            <div className="w-full space-y-8">

              {/* Dealer hand */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Dealer</span>
                  <motion.span
                    key={dealerValue}
                    initial={{ scale: 1.25 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      'text-sm font-bold px-2 py-0.5 rounded-lg',
                      isGameOver && status === 'dealer_bust'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    {dealerValue}
                  </motion.span>
                </div>

                <div className="flex justify-center" style={{ perspective: '800px' }}>
                  {dealerHand.map((card, i) => (
                    <PlayingCard
                      key={`d-r${roundRef.current}-${i}`}
                      cardKey={i === 1 ? HOLE_CARD_KEY : undefined}
                      card={card}
                      index={i}
                      delay={i === 1 && flipRevealIndex === null ? 0 : 0}
                      flipReveal={flipRevealIndex === i}
                    />
                  ))}
                  {/* Hidden hole card during play */}
                  {isPlaying && dealerHand.length === 1 && (
                    <PlayingCard
                      key={HOLE_CARD_KEY}
                      card={{ suit: '', rank: '', value: 0 }}
                      index={1}
                      hidden
                      delay={0.3}
                    />
                  )}
                </div>
              </div>

              {/* Status banner */}
              <AnimatePresence>
                {isGameOver && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className={cn(
                      'text-center py-3 rounded-xl font-heading text-xl',
                      winAmount > 0
                        ? 'bg-success/10 text-success border border-success/30'
                        : status === 'push'
                          ? 'bg-muted text-foreground border border-border'
                          : 'bg-destructive/10 text-destructive border border-destructive/30'
                    )}
                  >
                    {getStatusText()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Player hand */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Du</span>
                  <motion.span
                    key={playerValue}
                    initial={{ scale: 1.25 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      'text-sm font-bold px-2 py-0.5 rounded-lg',
                      playerValue > 21
                        ? 'bg-destructive/20 text-destructive'
                        : playerValue === 21
                          ? 'bg-success/20 text-success'
                          : 'bg-muted text-foreground'
                    )}
                  >
                    {playerValue}
                  </motion.span>
                </div>
                <div className="flex justify-center" style={{ perspective: '800px' }}>
                  {playerHand.map((card, i) => (
                    <PlayingCard
                      key={`p-r${roundRef.current}-${i}`}
                      card={card}
                      index={i}
                      delay={i * 0.12}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlackjackGame;
