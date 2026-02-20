import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Loader2, Sparkles, Trophy, RotateCcw, Hand, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useShardBalance } from '@/hooks/useShards';
import { usePlayBlackjack, useActiveGameSession } from '@/hooks/useGames';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Card {
  suit: string;
  rank: string;
  value: number;
}

const suitColor = (suit: string) => {
  return suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-foreground';
};

const PlayingCard = ({ card, index, hidden = false, delay = 0 }: { card: Card; index: number; hidden?: boolean; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: -40, rotateY: hidden ? 180 : 0 }}
    animate={{ opacity: 1, y: 0, rotateY: 0 }}
    transition={{ delay: delay * 0.15, type: 'spring', stiffness: 300, damping: 20 }}
    className={cn(
      'relative w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 border-border flex flex-col items-center justify-center font-bold shadow-lg select-none',
      hidden ? 'bg-gradient-to-br from-primary/80 to-primary' : 'bg-card'
    )}
    style={{ marginLeft: index > 0 ? '-16px' : '0', zIndex: index }}
  >
    {hidden ? (
      <div className="text-primary-foreground text-2xl">?</div>
    ) : (
      <>
        <span className={cn('text-xs absolute top-1.5 left-2', suitColor(card.suit))}>{card.rank}</span>
        <span className={cn('text-2xl sm:text-3xl', suitColor(card.suit))}>{card.suit}</span>
        <span className={cn('text-xs absolute bottom-1.5 right-2 rotate-180', suitColor(card.suit))}>{card.rank}</span>
      </>
    )}
  </motion.div>
);

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
  // True while we're animating dealer cards (buttons disabled, but no spinner)
  const [isAnimating, setIsAnimating] = useState(false);

  const hasRestored = useRef(false);

  const isPlaying = status === 'playing';
  const isGameOver = ['player_bust', 'dealer_bust', 'player_win', 'dealer_win', 'push', 'blackjack'].includes(status);

  // Restore active session
  useEffect(() => {
    if (activeSession && !hasRestored.current && !sessionId) {
      hasRestored.current = true;
      const s = activeSession.state as any;
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

  // Celebration
  useEffect(() => {
    if (isGameOver && winAmount > 0) {
      setShowCelebration(true);
      const t = setTimeout(() => setShowCelebration(false), 2500);
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
    hasRestored.current = false;
  }, []);

  // Animate dealer cards sequentially, then reveal result
  const animateDealerReveal = useCallback(async (
    fullDealerHand: Card[],
    finalStatus: string,
    finalWinAmount: number,
    finalPlayerValue: number,
    finalDealerValue: number,
  ) => {
    setIsAnimating(true);

    // Step 1: Reveal hole card (the second card)
    setDealerHand([fullDealerHand[0], fullDealerHand[1]]);
    setDealerValue(handValueCalc(fullDealerHand.slice(0, 2)));
    await new Promise(r => setTimeout(r, 600));

    // Step 2: Draw additional cards one by one
    for (let i = 2; i < fullDealerHand.length; i++) {
      setDealerHand(fullDealerHand.slice(0, i + 1));
      setDealerValue(handValueCalc(fullDealerHand.slice(0, i + 1)));
      await new Promise(r => setTimeout(r, 700));
    }

    // Step 3: Short pause before showing result
    await new Promise(r => setTimeout(r, 400));

    // Step 4: Now reveal the final result
    setPlayerValue(finalPlayerValue);
    setDealerValue(finalDealerValue);
    setStatus(finalStatus);
    setWinAmount(finalWinAmount);
    setIsAnimating(false);
    refetchBalance();
  }, [refetchBalance]);

  const handleDeal = async () => {
    if (isActing || isAnimating || betAmount < 10 || betAmount > (balance?.balance || 0)) return;
    setIsActing(true);
    resetGame();

    try {
      const result = await playBlackjack.mutateAsync({ action: 'deal', betAmount });
      setSessionId(result.sessionId);
      setPlayerHand(result.playerHand);
      setDealerHand(result.dealerHand);
      setPlayerValue(result.playerValue);
      setDealerValue(result.dealerValue);
      setStatus(result.status);
      setWinAmount(result.winAmount || 0);
      refetchBalance();
    } catch {
      // handled by mutation
    } finally {
      setIsActing(false);
    }
  };

  const handleHit = async () => {
    if (!sessionId || isActing || isAnimating || !isPlaying) return;
    setIsActing(true);

    try {
      const result = await playBlackjack.mutateAsync({ action: 'hit', sessionId });

      // Always show the new player card first
      setPlayerHand(result.playerHand);
      setPlayerValue(result.playerValue);

      if (result.status === 'playing') {
        // Still playing – keep dealer hidden
        setDealerHand(result.dealerHand);
        setDealerValue(result.dealerValue);
        setIsActing(false);
      } else if (result.status === 'player_bust') {
        // Bust – reveal dealer cards, then show result
        setIsActing(false);
        await animateDealerReveal(
          result.dealerHand,
          result.status,
          result.winAmount || 0,
          result.playerValue,
          result.dealerValue,
        );
      } else {
        // Auto-stand on 21 – animate dealer
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

  const handleStand = async () => {
    if (!sessionId || isActing || isAnimating || !isPlaying) return;
    setIsActing(true);

    try {
      const result = await playBlackjack.mutateAsync({ action: 'stand', sessionId });

      // Don't set status yet – animate first
      setPlayerHand(result.playerHand);
      setIsActing(false);

      // Animate dealer cards, then show result
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

  const getStatusText = () => {
    switch (status) {
      case 'blackjack': return '🃏 BLACKJACK!';
      case 'player_win': return '🎉 Du vandt!';
      case 'dealer_bust': return '💥 Dealer bust!';
      case 'player_bust': return '💀 Bust!';
      case 'dealer_win': return '😞 Dealer vinder';
      case 'push': return '🤝 Push (uafgjort)';
      default: return '';
    }
  };

  const quickBets = [100, 500, 1000, 5000];
  const isBusy = isActing || isAnimating;

  if (loadingSession) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
      {/* Celebration particles */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div className="absolute inset-0 pointer-events-none z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ x: '50%', y: '40%', scale: 0, opacity: 1 }}
                animate={{
                  x: `${20 + Math.random() * 60}%`,
                  y: `${Math.random() * 80}%`,
                  scale: [0, 1.2, 0.8],
                  opacity: [1, 1, 0],
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: 1.2, delay: Math.random() * 0.2, ease: 'easeOut' }}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          {/* Balance */}
          <div className="bg-background/50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Din saldo</span>
            <motion.span
              key={balance?.balance}
              initial={{ scale: 1.1, color: 'hsl(var(--success))' }}
              animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
              className="font-bold text-lg"
            >
              {formatShards(balance?.balance || 0)} Shards
            </motion.span>
          </div>

          {/* Bet controls (only when not playing) */}
          {!isPlaying && !isAnimating && (
            <>
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
            </>
          )}

          {/* Game info during play */}
          {(isPlaying || isGameOver || isAnimating) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-background rounded-xl p-4 space-y-2">
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
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  onClick={handleDeal}
                  disabled={isBusy || betAmount > (balance?.balance || 0) || betAmount < 10}
                >
                  {isActing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isGameOver ? (
                    <>
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Nyt spil ({formatShards(betAmount)} Shards)
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Deal ({formatShards(betAmount)} Shards)
                    </>
                  )}
                </Button>
              </motion.div>
            ) : isPlaying ? (
              <div className="grid grid-cols-2 gap-3">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    className="w-full h-12 text-base font-semibold bg-success hover:bg-success/90"
                    onClick={handleHit}
                    disabled={isBusy}
                  >
                    {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Hand className="w-4 h-4 mr-2" />Hit</>}
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    className="w-full h-12 text-base font-semibold bg-accent hover:bg-accent/90"
                    onClick={handleStand}
                    disabled={isBusy}
                  >
                    {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Square className="w-4 h-4 mr-2" />Stand</>}
                  </Button>
                </motion.div>
              </div>
            ) : isAnimating ? (
              <div className="text-center py-3">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-muted-foreground text-sm font-medium"
                >
                  Dealer trækker kort...
                </motion.p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Table */}
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          {status === 'idle' && !isAnimating ? (
            <div className="text-center text-muted-foreground">
              <span className="text-6xl mb-4 block">🃏</span>
              <p className="text-lg font-medium">Placer din indsats og tryk Deal</p>
            </div>
          ) : (
            <div className="w-full space-y-8">
              {/* Dealer's hand */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Dealer</span>
                  <motion.span
                    key={dealerValue}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      'text-sm font-bold px-2 py-0.5 rounded-lg',
                      isGameOver && (status === 'dealer_bust') ? 'bg-destructive/20 text-destructive' : 'bg-muted text-foreground'
                    )}
                  >
                    {dealerValue}
                  </motion.span>
                </div>
                <div className="flex justify-center">
                  {dealerHand.map((card, i) => (
                    <PlayingCard key={`d-${i}-${card.rank}${card.suit}`} card={card} index={i} delay={i} />
                  ))}
                  {/* Hidden hole card during play */}
                  {isPlaying && dealerHand.length === 1 && (
                    <PlayingCard card={{ suit: '', rank: '', value: 0 }} index={1} hidden delay={1} />
                  )}
                </div>
              </div>

              {/* Status banner */}
              <AnimatePresence>
                {isGameOver && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      'text-center py-3 rounded-xl font-heading text-xl',
                      winAmount > 0 ? 'bg-success/10 text-success border border-success/30' : status === 'push' ? 'bg-muted text-foreground border border-border' : 'bg-destructive/10 text-destructive border border-destructive/30'
                    )}
                  >
                    {getStatusText()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Player's hand */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Du</span>
                  <motion.span
                    key={playerValue}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      'text-sm font-bold px-2 py-0.5 rounded-lg',
                      playerValue > 21 ? 'bg-destructive/20 text-destructive' :
                      playerValue === 21 ? 'bg-success/20 text-success' :
                      'bg-muted text-foreground'
                    )}
                  >
                    {playerValue}
                  </motion.span>
                </div>
                <div className="flex justify-center">
                  {playerHand.map((card, i) => (
                    <PlayingCard key={`p-${i}-${card.rank}${card.suit}`} card={card} index={i} delay={i} />
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
