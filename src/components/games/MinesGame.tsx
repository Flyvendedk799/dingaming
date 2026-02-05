import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bomb, Diamond, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useShardBalance } from '@/hooks/useShards';
import { useStartMinesGame, useRevealMinesTile, useCashoutMines } from '@/hooks/useGames';
import { cn } from '@/lib/utils';

interface TileState {
  revealed: boolean;
  isMine: boolean;
  isGem: boolean;
}

const MinesGame = () => {
  const { data: balance } = useShardBalance();
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

  const isPlaying = sessionId !== null && !gameOver;

  const resetGame = useCallback(() => {
    setSessionId(null);
    setTiles(Array(25).fill({ revealed: false, isMine: false, isGem: false }));
    setCurrentMultiplier(1);
    setNextMultiplier(1);
    setPotentialWin(0);
    setGameOver(false);
    setGameWon(false);
    setRevealedCount(0);
  }, []);

  const handleStart = async () => {
    if (betAmount < 10 || betAmount > (balance?.balance || 0)) return;
    
    resetGame();
    
    try {
      const result = await startGame.mutateAsync({ betAmount, mineCount });
      setSessionId(result.sessionId);
      setNextMultiplier(result.nextMultiplier);
    } catch (e) {
      // Error handled by mutation
    }
  };

  const handleReveal = async (index: number) => {
    if (!sessionId || tiles[index].revealed || gameOver) return;
    
    try {
      const result = await revealTile.mutateAsync({ sessionId, tileIndex: index });
      
      const newTiles = [...tiles];
      
      if (result.hitMine) {
        // Reveal all mines
        result.mines?.forEach(mineIdx => {
          newTiles[mineIdx] = { revealed: true, isMine: true, isGem: false };
        });
        // Mark revealed gems
        result.revealed.forEach(revIdx => {
          if (!result.mines?.includes(revIdx)) {
            newTiles[revIdx] = { revealed: true, isMine: false, isGem: true };
          }
        });
        setGameOver(true);
      } else {
        // Mark as gem
        newTiles[index] = { revealed: true, isMine: false, isGem: true };
        setCurrentMultiplier(result.currentMultiplier || 1);
        setNextMultiplier(result.nextMultiplier || 1);
        setPotentialWin(result.potentialWin || 0);
        setRevealedCount(result.revealed.length);
        
        if (result.autoWin) {
          // All gems found!
          setGameWon(true);
          setGameOver(true);
          result.mines?.forEach(mineIdx => {
            newTiles[mineIdx] = { revealed: true, isMine: true, isGem: false };
          });
        }
      }
      
      setTiles(newTiles);
    } catch (e) {
      // Error handled by mutation
    }
  };

  const handleCashout = async () => {
    if (!sessionId || gameOver || revealedCount === 0) return;
    
    try {
      const result = await cashout.mutateAsync({ sessionId });
      
      // Reveal all mines
      const newTiles = [...tiles];
      result.mines.forEach(mineIdx => {
        if (!newTiles[mineIdx].revealed) {
          newTiles[mineIdx] = { revealed: true, isMine: true, isGem: false };
        }
      });
      setTiles(newTiles);
      setGameWon(true);
      setGameOver(true);
    } catch (e) {
      // Error handled by mutation
    }
  };

  const formatShards = (shards: number) => {
    return new Intl.NumberFormat('da-DK').format(shards);
  };

  const quickBets = [100, 500, 1000, 5000];

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bomb className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-heading text-xl text-foreground">Mines</h2>
          <p className="text-sm text-muted-foreground">Undgå minerne og vind stort!</p>
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
                <Button
                  key={qb}
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setBetAmount(qb)}
                  disabled={isPlaying || qb > (balance?.balance || 0)}
                >
                  {qb}
                </Button>
              ))}
            </div>
          </div>

          {/* Mine Count */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-muted-foreground">
                Antal miner
              </label>
              <span className="text-sm font-medium text-foreground">{mineCount}</span>
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
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background rounded-xl p-4 space-y-3"
            >
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nuværende</span>
                <span className="font-semibold text-foreground">x{currentMultiplier.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Næste</span>
                <span className="font-semibold text-success">x{nextMultiplier.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Potentiel gevinst</span>
                <span className="font-semibold text-primary">{formatShards(potentialWin)}</span>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!isPlaying ? (
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleStart}
                disabled={startGame.isPending || betAmount > (balance?.balance || 0)}
              >
                {startGame.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Start Spil ({formatShards(betAmount)} Shards)
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="w-full bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleCashout}
                disabled={cashout.isPending || revealedCount === 0}
              >
                {cashout.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Udbetal {formatShards(potentialWin)} Shards
                  </>
                )}
              </Button>
            )}

            {gameOver && (
              <Button
                variant="outline"
                className="w-full"
                onClick={resetGame}
              >
                Nyt Spil
              </Button>
            )}
          </div>
        </div>

        {/* Game Grid */}
        <div className="aspect-square">
          <div className="grid grid-cols-5 gap-2 h-full">
            {tiles.map((tile, index) => (
              <motion.button
                key={index}
                onClick={() => handleReveal(index)}
                disabled={!isPlaying || tile.revealed || revealTile.isPending}
                className={cn(
                  "aspect-square rounded-xl border-2 flex items-center justify-center transition-all",
                  !tile.revealed && isPlaying && "bg-card hover:bg-muted cursor-pointer border-border hover:border-primary/50",
                  !tile.revealed && !isPlaying && "bg-muted border-border cursor-not-allowed opacity-50",
                  tile.revealed && tile.isGem && "bg-success/20 border-success",
                  tile.revealed && tile.isMine && "bg-destructive/20 border-destructive"
                )}
                whileHover={!tile.revealed && isPlaying ? { scale: 1.05 } : undefined}
                whileTap={!tile.revealed && isPlaying ? { scale: 0.95 } : undefined}
              >
                <AnimatePresence mode="wait">
                  {tile.revealed && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      {tile.isGem ? (
                        <Diamond className="w-6 h-6 md:w-8 md:h-8 text-success" />
                      ) : (
                        <Bomb className="w-6 h-6 md:w-8 md:h-8 text-destructive" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Result Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-4 rounded-xl text-center"
            style={{
              background: gameWon 
                ? 'linear-gradient(135deg, hsl(var(--success)/0.1), hsl(var(--success)/0.05))'
                : 'linear-gradient(135deg, hsl(var(--destructive)/0.1), hsl(var(--destructive)/0.05))'
            }}
          >
            <p className={cn(
              "text-lg font-semibold",
              gameWon ? "text-success" : "text-destructive"
            )}>
              {gameWon ? `Du vandt ${formatShards(potentialWin)} Shards!` : 'Du ramte en mine!'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MinesGame;
