import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Bomb, Diamond, Zap, Loader2, Sparkles, Trophy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useShardBalance } from '@/hooks/useShards';
import { useStartMinesGame, useRevealMinesTile, useCashoutMines, useActiveGameSession, calculateMinesMultiplier } from '@/hooks/useGames';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TileState {
  revealed: boolean;
  isMine: boolean;
  isGem: boolean;
  revealOrder?: number;
}

const MinesGame = () => {
  const { data: balance, refetch: refetchBalance } = useShardBalance();
  const { data: activeSession, isLoading: loadingSession } = useActiveGameSession('mines');
  const startGame = useStartMinesGame();
  const revealTile = useRevealMinesTile();
  const cashout = useCashoutMines();

  const [betAmount, setBetAmount] = useState(100);
  const [mineCount, setMineCount] = useState(5);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tiles, setTiles] = useState<TileState[]>(Array(25).fill({ revealed: false, isMine: false, isGem: false }));
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [nextMultiplier, setNextMultiplier] = useState(1);
  const [potentialWin, setPotentialWin] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [lastRevealedIndex, setLastRevealedIndex] = useState<number | null>(null);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const multiplierControls = useAnimation();
  const hasRestoredSession = useRef(false);
  const startGuardRef = useRef(false);

  const isPlaying = sessionId !== null && !gameOver;

  const applySessionState = useCallback(
    (
      sid: string,
      state: {
        mines: number[];
        revealed: number[];
        betAmount: number;
        currentMultiplier: number;
        cashedOut: boolean;
        hitMine: boolean;
      }
    ) => {
      // Restore session state
      setSessionId(sid);
      setBetAmount(state.betAmount);
      setMineCount(state.mines.length);
      setRevealedCount(state.revealed.length);
      setCurrentMultiplier(state.currentMultiplier);
      setNextMultiplier(calculateMinesMultiplier(state.revealed.length + 1, state.mines.length));
      setPotentialWin(state.revealed.length === 0 ? 0 : Math.floor(state.betAmount * state.currentMultiplier));

      // Restore tiles
      const restoredTiles = Array(25)
        .fill(null)
        .map((_, i) => ({
          revealed: state.revealed.includes(i),
          isMine: false, // Don't reveal mines until game ends
          isGem: state.revealed.includes(i),
          revealOrder: state.revealed.indexOf(i),
        }));
      setTiles(restoredTiles);

      // Active sessions are always playable
      setGameOver(false);
      setGameWon(false);
      setLastRevealedIndex(null);
    },
    []
  );

  // Restore active session on page load
  useEffect(() => {
    if (activeSession && !hasRestoredSession.current && !sessionId) {
      hasRestoredSession.current = true;
      setIsRestoringSession(true);

      const state = activeSession.state;
      applySessionState(activeSession.session_id, state);

      toast.info('Aktivt spil gendannet', {
        description: `${state.revealed.length} gems fundet - x${state.currentMultiplier.toFixed(2)}`,
      });

      setTimeout(() => setIsRestoringSession(false), 500);
    }
  }, [activeSession, applySessionState, sessionId]);

  // Pulse multiplier on update
  useEffect(() => {
    if (currentMultiplier > 1) {
      multiplierControls.start({
        scale: [1, 1.15, 1],
        transition: { duration: 0.3, ease: "easeOut" }
      });
    }
  }, [currentMultiplier, multiplierControls]);

  // Celebration effect
  useEffect(() => {
    if (gameWon && potentialWin > 0) {
      setShowWinCelebration(true);
      const timer = setTimeout(() => setShowWinCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [gameWon, potentialWin]);

  const resetGame = useCallback(() => {
    setSessionId(null);
    setTiles(Array(25).fill({ revealed: false, isMine: false, isGem: false }));
    setCurrentMultiplier(1);
    setNextMultiplier(1);
    setPotentialWin(0);
    setGameOver(false);
    setGameWon(false);
    setRevealedCount(0);
    setLastRevealedIndex(null);
    setShowWinCelebration(false);
    hasRestoredSession.current = false;
  }, []);

  const handleStart = async () => {
    // Prevent rapid double-taps from charging twice before React re-renders
    if (startGuardRef.current || startGame.isPending) return;

    if (betAmount < 10 || betAmount > (balance?.balance || 0)) return;

    startGuardRef.current = true;
    resetGame();

    try {
      const result = await startGame.mutateAsync({ betAmount, mineCount });

      if (result.state) {
        applySessionState(result.sessionId, result.state);
      } else {
        setSessionId(result.sessionId);
        setNextMultiplier(result.nextMultiplier);
      }

      // Refetch balance to ensure UI is in sync
      refetchBalance();
    } catch (e) {
      // Error handled by mutation
    } finally {
      startGuardRef.current = false;
    }
  };

  const handleReveal = async (index: number) => {
    if (!sessionId || tiles[index].revealed || gameOver || isRevealing) return;
    
    setIsRevealing(true);
    setLastRevealedIndex(index);
    
    try {
      const result = await revealTile.mutateAsync({ sessionId, tileIndex: index });
      
      const newTiles = [...tiles];
      
      if (result.hitMine) {
        // First show the clicked mine with delay
        newTiles[index] = { revealed: true, isMine: true, isGem: false, revealOrder: 0 };
        setTiles([...newTiles]);
        
        // Then reveal other mines with staggered delay
        await new Promise(r => setTimeout(r, 400));
        
        let order = 1;
        result.mines?.forEach(mineIdx => {
          if (mineIdx !== index) {
            newTiles[mineIdx] = { revealed: true, isMine: true, isGem: false, revealOrder: order++ };
          }
        });
        // Mark revealed gems
        result.revealed.forEach(revIdx => {
          if (!result.mines?.includes(revIdx)) {
            newTiles[revIdx] = { revealed: true, isMine: false, isGem: true };
          }
        });
        setTiles(newTiles);
        setGameOver(true);
        // Refetch balance after game ends
        refetchBalance();
      } else {
        // Mark as gem with satisfying animation
        newTiles[index] = { revealed: true, isMine: false, isGem: true, revealOrder: revealedCount };
        setCurrentMultiplier(result.currentMultiplier || 1);
        setNextMultiplier(result.nextMultiplier || 1);
        setPotentialWin(result.potentialWin || 0);
        setRevealedCount(result.revealed.length);
        
        if (result.autoWin) {
          // All gems found!
          setGameWon(true);
          setGameOver(true);
          
          await new Promise(r => setTimeout(r, 300));
          result.mines?.forEach((mineIdx, i) => {
            newTiles[mineIdx] = { revealed: true, isMine: true, isGem: false, revealOrder: i };
          });
          // Refetch balance after win
          refetchBalance();
        }
        
        setTiles(newTiles);
      }
    } catch (e) {
      // Error handled by mutation
    } finally {
      setIsRevealing(false);
    }
  };

  const handleCashout = async () => {
    if (!sessionId || gameOver || revealedCount === 0) return;
    
    try {
      const result = await cashout.mutateAsync({ sessionId });
      
      // Reveal all mines with stagger
      const newTiles = [...tiles];
      result.mines.forEach((mineIdx, i) => {
        if (!newTiles[mineIdx].revealed) {
          newTiles[mineIdx] = { revealed: true, isMine: true, isGem: false, revealOrder: i };
        }
      });
      setTiles(newTiles);
      setGameWon(true);
      setGameOver(true);
      // Refetch balance after cashout
      refetchBalance();
    } catch (e) {
      // Error handled by mutation
    }
  };

  const formatShards = (shards: number) => {
    return new Intl.NumberFormat('da-DK').format(shards);
  };

  const quickBets = [100, 500, 1000, 5000];

  // Calculate grid glow intensity based on multiplier
  const glowIntensity = Math.min((currentMultiplier - 1) * 10, 100);

  // Show loading state while checking for active session
  if (loadingSession) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
      {/* Session restoration indicator */}
      <AnimatePresence>
        {isRestoringSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="flex items-center gap-3 text-primary">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="font-medium">Gendanner spil...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background glow effect based on multiplier */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{ 
          opacity: isPlaying ? glowIntensity / 200 : 0,
          background: `radial-gradient(circle at center, hsl(var(--success) / 0.15), transparent 70%)`
        }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Win celebration particles */}
      <AnimatePresence>
        {showWinCelebration && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ 
                  x: '50%', 
                  y: '50%',
                  scale: 0,
                  opacity: 1 
                }}
                animate={{ 
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1, 0.5],
                  opacity: [1, 1, 0],
                  rotate: Math.random() * 360
                }}
                transition={{ 
                  duration: 1.5 + Math.random(),
                  delay: Math.random() * 0.3,
                  ease: "easeOut"
                }}
              >
                <Sparkles className="w-4 h-4 text-success" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 mb-6 relative">
        <motion.div 
          className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
        >
          <Bomb className="w-5 h-5 text-primary" />
        </motion.div>
        <div>
          <h2 className="font-heading text-xl text-foreground">Mines</h2>
          <p className="text-sm text-muted-foreground">Undgå minerne og vind stort!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {/* Controls */}
        <div className="space-y-4">
          {/* Balance Display */}
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
                disabled={isPlaying}
                className="bg-background"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBetAmount(Math.floor(betAmount / 2))}
                disabled={isPlaying || betAmount < 20}
              >
                ½
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBetAmount(Math.min(betAmount * 2, balance?.balance || 0))}
                disabled={isPlaying}
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
                    disabled={isPlaying || qb > (balance?.balance || 0)}
                  >
                    {qb}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mine Count */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-muted-foreground">
                Antal miner
              </label>
              <motion.span 
                key={mineCount}
                initial={{ scale: 1.2, color: 'hsl(var(--primary))' }}
                animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
                className="text-sm font-medium"
              >
                {mineCount}
              </motion.span>
            </div>
            <Slider
              value={[mineCount]}
              onValueChange={([value]) => setMineCount(value)}
              min={1}
              max={24}
              step={1}
              disabled={isPlaying}
              className="my-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 (Lav risiko)</span>
              <span>24 (Høj risiko)</span>
            </div>
          </div>

          {/* Game Stats */}
          <AnimatePresence mode="wait">
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-background rounded-xl p-4 space-y-3 overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nuværende</span>
                  <motion.span 
                    animate={multiplierControls}
                    className="font-semibold text-foreground text-lg"
                  >
                    x{currentMultiplier.toFixed(2)}
                  </motion.span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Næste</span>
                  <motion.span 
                    key={nextMultiplier}
                    initial={{ opacity: 0.5, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-semibold text-success"
                  >
                    x{nextMultiplier.toFixed(2)}
                  </motion.span>
                </div>
                <motion.div 
                  className="flex justify-between items-center pt-2 border-t border-border"
                  layout
                >
                  <span className="text-muted-foreground">Potentiel gevinst</span>
                  <motion.span 
                    key={potentialWin}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="font-bold text-primary text-lg"
                  >
                    {formatShards(potentialWin)}
                  </motion.span>
                </motion.div>
                
                {/* Progress bar showing gems found */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Gems fundet</span>
                    <span>{revealedCount} / {25 - mineCount}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-success to-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(revealedCount / (25 - mineCount)) * 100}%` }}
                      transition={{ type: "spring", stiffness: 100 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="space-y-2">
            {!isPlaying ? (
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 h-12 text-base"
                  onClick={handleStart}
                  disabled={startGame.isPending || betAmount > (balance?.balance || 0)}
                >
                  {startGame.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Start Spil ({formatShards(betAmount)} Shards)
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                whileTap={{ scale: 0.98 }}
                animate={revealedCount > 0 ? { 
                  boxShadow: ['0 0 0px hsl(var(--success))', '0 0 20px hsl(var(--success) / 0.5)', '0 0 0px hsl(var(--success))']
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="rounded-md"
              >
                <Button
                  className={cn(
                    "w-full h-12 text-base transition-all duration-300",
                    revealedCount > 0 
                      ? "bg-success hover:bg-success/90 text-success-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}
                  onClick={handleCashout}
                  disabled={cashout.isPending || revealedCount === 0}
                >
                  {cashout.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Trophy className="w-5 h-5 mr-2" />
                      Udbetal {formatShards(potentialWin)} Shards
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            <AnimatePresence>
              {gameOver && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Button
                    variant="outline"
                    className="w-full h-10"
                    onClick={resetGame}
                  >
                    Nyt Spil
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Game Grid */}
        <div className="aspect-square" ref={gridRef}>
          <motion.div 
            className="grid grid-cols-5 gap-2 h-full"
            animate={gameOver && !gameWon ? { x: [0, -5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {tiles.map((tile, index) => (
              <motion.button
                key={index}
                onClick={() => handleReveal(index)}
                disabled={!isPlaying || tile.revealed || isRevealing}
                className={cn(
                  "aspect-square rounded-xl border-2 flex items-center justify-center transition-colors relative overflow-hidden",
                  !tile.revealed && isPlaying && "bg-card hover:bg-muted cursor-pointer border-border",
                  !tile.revealed && !isPlaying && "bg-muted border-border cursor-not-allowed opacity-50",
                  tile.revealed && tile.isGem && "bg-success/20 border-success",
                  tile.revealed && tile.isMine && "bg-destructive/20 border-destructive"
                )}
                whileHover={!tile.revealed && isPlaying ? { 
                  scale: 1.08, 
                  borderColor: 'hsl(var(--primary))',
                  boxShadow: '0 0 15px hsl(var(--primary) / 0.3)'
                } : undefined}
                whileTap={!tile.revealed && isPlaying ? { scale: 0.92 } : undefined}
                animate={
                  lastRevealedIndex === index && !tile.revealed && isRevealing
                    ? { scale: [1, 0.9, 1], opacity: [1, 0.7, 1] }
                    : {}
                }
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {/* Hover ripple effect */}
                {!tile.revealed && isPlaying && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0"
                    whileHover={{ opacity: 1 }}
                  />
                )}
                
                <AnimatePresence mode="wait">
                  {tile.revealed && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        rotate: 0, 
                        opacity: 1,
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 15,
                        delay: tile.revealOrder ? tile.revealOrder * 0.08 : 0
                      }}
                      className="relative"
                    >
                      {tile.isGem ? (
                        <>
                          <Diamond className="w-6 h-6 md:w-8 md:h-8 text-success relative z-10" />
                          <motion.div
                            className="absolute inset-0 blur-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.8, 0.4] }}
                            transition={{ duration: 0.5 }}
                          >
                            <Diamond className="w-6 h-6 md:w-8 md:h-8 text-success" />
                          </motion.div>
                        </>
                      ) : (
                        <motion.div
                          animate={{ 
                            scale: [1, 1.2, 1],
                          }}
                          transition={{ 
                            duration: 0.3,
                            delay: tile.revealOrder ? tile.revealOrder * 0.08 : 0
                          }}
                        >
                          <Bomb className="w-6 h-6 md:w-8 md:h-8 text-destructive" />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Loading indicator on revealing tile */}
                {lastRevealedIndex === index && isRevealing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-card/80"
                  >
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Result Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "mt-4 p-5 rounded-xl text-center relative overflow-hidden",
              gameWon ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30"
            )}
          >
            {/* Animated background */}
            <motion.div
              className={cn(
                "absolute inset-0",
                gameWon 
                  ? "bg-gradient-to-r from-success/5 via-success/10 to-success/5" 
                  : "bg-gradient-to-r from-destructive/5 via-destructive/10 to-destructive/5"
              )}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="mb-2"
              >
                {gameWon ? (
                  <Trophy className="w-10 h-10 mx-auto text-success" />
                ) : (
                  <Bomb className="w-10 h-10 mx-auto text-destructive" />
                )}
              </motion.div>
              <motion.p 
                className={cn(
                  "text-xl font-bold",
                  gameWon ? "text-success" : "text-destructive"
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {gameWon ? `Du vandt ${formatShards(potentialWin)} Shards!` : 'Du ramte en mine!'}
              </motion.p>
              {gameWon && currentMultiplier > 1 && (
                <motion.p
                  className="text-sm text-muted-foreground mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  x{currentMultiplier.toFixed(2)} multiplier
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MinesGame;