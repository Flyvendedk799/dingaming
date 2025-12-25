import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import game1 from "@/assets/game-1.jpg";
import game2 from "@/assets/game-2.jpg";
import game3 from "@/assets/game-3.jpg";
import game4 from "@/assets/game-4.jpg";
import game5 from "@/assets/game-5.jpg";
import game6 from "@/assets/game-6.jpg";

const games = [
  { image: game1, name: "Elden Ring", rarity: "legendary" as const },
  { image: game2, name: "Cyberpunk 2077", rarity: "epic" as const },
  { image: game3, name: "God of War", rarity: "epic" as const },
  { image: game4, name: "Hogwarts Legacy", rarity: "rare" as const },
  { image: game5, name: "Red Dead 2", rarity: "legendary" as const },
  { image: game6, name: "Baldur's Gate 3", rarity: "legendary" as const },
];

const rarityColors = {
  rare: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.6)' },
  epic: { primary: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)' },
  legendary: { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.7)' },
};

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<'waiting' | 'opening' | 'cards-flying' | 'selection' | 'reveal' | 'complete'>('waiting');
  const [selectedGame, setSelectedGame] = useState(games[4]);
  const [flyingCards, setFlyingCards] = useState<Array<{ id: number; game: typeof games[0]; delay: number; angle: number }>>([]);
  const isMobile = useIsMobile();
  
  // Mouse tracking for 3D effect - ALL hooks at top level
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 100, damping: 30 });
  
  const rotateX = useTransform(smoothMouseY, [-300, 300], [8, -8]);
  const rotateY = useTransform(smoothMouseX, [-400, 400], [-8, 8]);

  // Case lid animation - hook at top level
  const caseOpenSpring = useSpring(0, { stiffness: 80, damping: 15 });
  const lidRotateX = useTransform(caseOpenSpring, [0, 100], [0, -120]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  }, [mouseX, mouseY]);

  // Generate flying cards
  useEffect(() => {
    if (phase === 'cards-flying') {
      const cards = [];
      for (let i = 0; i < 20; i++) {
        cards.push({
          id: i,
          game: games[i % games.length],
          delay: i * 0.08,
          angle: (Math.random() - 0.5) * 60,
        });
      }
      setFlyingCards(cards);
      
      setTimeout(() => setPhase('selection'), 2000);
    }
  }, [phase]);

  // Selection phase
  useEffect(() => {
    if (phase === 'selection') {
      const timer = setTimeout(() => {
        setSelectedGame(games[Math.floor(Math.random() * games.length)]);
        setPhase('reveal');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Complete after reveal
  useEffect(() => {
    if (phase === 'reveal') {
      const timer = setTimeout(() => setPhase('complete'), 3500);
      return () => clearTimeout(timer);
    }
    if (phase === 'complete') onComplete();
  }, [phase, onComplete]);

  // Handle case opening interaction
  const handleCaseClick = useCallback(() => {
    if (phase === 'waiting') {
      setPhase('opening');
      caseOpenSpring.set(100);
      setTimeout(() => setPhase('cards-flying'), 1200);
    }
  }, [phase, caseOpenSpring]);

  const handleSkip = useCallback(() => {
    if (phase !== 'complete') setPhase('complete');
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') handleSkip(); 
      if (e.key === ' ' && phase === 'waiting') handleCaseClick();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSkip, handleCaseClick, phase]);

  const rarityConfig = useMemo(() => rarityColors[selectedGame.rarity], [selectedGame.rarity]);

  return (
    <AnimatePresence>
      {phase !== 'complete' && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden"
          onMouseMove={handleMouseMove}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{ 
            background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 50%, #0a0a0f 100%)',
          }}
        >
          {/* Atmospheric fog layers */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
              }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139, 92, 246, 0.05) 0%, transparent 60%)',
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </div>

          {/* Floating dust particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-emerald-400/30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100 - Math.random() * 100],
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 6 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          {/* Skip hint */}
          <motion.div
            className="absolute top-6 right-6 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1 }}
          >
            <button 
              onClick={handleSkip}
              className="text-xs tracking-widest text-white/40 hover:text-white/70 transition-colors font-mono"
            >
              ESC TO SKIP
            </button>
          </motion.div>

          {/* WAITING PHASE - Interactive Case */}
          <AnimatePresence>
            {(phase === 'waiting' || phase === 'opening') && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5 }}
                style={{ perspective: '1000px' }}
              >
                <motion.div
                  className="relative cursor-pointer"
                  style={{ 
                    rotateX: phase === 'waiting' ? rotateX : 0,
                    rotateY: phase === 'waiting' ? rotateY : 0,
                    transformStyle: 'preserve-3d',
                  }}
                  onClick={handleCaseClick}
                  whileHover={phase === 'waiting' ? { scale: 1.02 } : {}}
                  whileTap={phase === 'waiting' ? { scale: 0.98 } : {}}
                >
                  {/* Case glow */}
                  <motion.div
                    className="absolute -inset-20 rounded-3xl"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
                    }}
                    animate={phase === 'waiting' ? {
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.1, 1],
                    } : {
                      opacity: 0,
                      scale: 1.5,
                    }}
                    transition={{ duration: 2, repeat: phase === 'waiting' ? Infinity : 0 }}
                  />

                  {/* Case base */}
                  <div 
                    className="relative"
                    style={{
                      width: isMobile ? 280 : 360,
                      height: isMobile ? 180 : 220,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Bottom of case */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: 'linear-gradient(145deg, #1a1a24 0%, #0f0f15 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        boxShadow: `
                          inset 0 2px 20px rgba(0,0,0,0.8),
                          0 20px 60px rgba(0,0,0,0.6),
                          0 0 100px rgba(16, 185, 129, 0.1)
                        `,
                        transform: 'translateZ(-20px)',
                      }}
                    >
                      {/* Inner velvet texture */}
                      <div 
                        className="absolute inset-4 rounded-xl"
                        style={{
                          background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)',
                          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
                        }}
                      />
                      
                      {/* Cards peek inside */}
                      <div className="absolute inset-8 flex items-center justify-center gap-2 opacity-50">
                        {games.slice(0, 3).map((game, i) => (
                          <div
                            key={i}
                            className="rounded-lg overflow-hidden"
                            style={{
                              width: isMobile ? 50 : 70,
                              height: isMobile ? 70 : 100,
                              transform: `rotate(${(i - 1) * 5}deg)`,
                            }}
                          >
                            <img src={game.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Case lid */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: 'linear-gradient(145deg, #1e1e2a 0%, #12121a 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        boxShadow: `
                          0 -2px 20px rgba(16, 185, 129, 0.1),
                          0 10px 40px rgba(0,0,0,0.4)
                        `,
                        transformOrigin: 'top center',
                        rotateX: lidRotateX,
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Lid design - Logo */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                          className="text-2xl md:text-3xl font-bold tracking-[0.2em]"
                          style={{
                            background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '0 0 40px rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          KEYBOX
                        </motion.div>
                        
                        <div className="flex items-center gap-3 mt-3">
                          <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-emerald-500/50" />
                          <motion.div
                            className="w-3 h-3 rounded-full border-2 border-emerald-500/50"
                            animate={{ 
                              boxShadow: ['0 0 10px rgba(16, 185, 129, 0.3)', '0 0 20px rgba(16, 185, 129, 0.6)', '0 0 10px rgba(16, 185, 129, 0.3)'],
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-emerald-500/50" />
                        </div>
                      </div>

                      {/* Lid inner face (visible when open) */}
                      <div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)',
                          transform: 'rotateX(180deg) translateZ(1px)',
                          backfaceVisibility: 'hidden',
                        }}
                      />
                    </motion.div>
                  </div>

                  {/* Click prompt */}
                  {phase === 'waiting' && (
                    <motion.div
                      className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.div
                        className="text-sm tracking-[0.3em] text-emerald-400/70 font-mono"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        CLICK TO OPEN
                      </motion.div>
                      <motion.div
                        className="mt-3 w-8 h-8 mx-auto rounded-full border border-emerald-500/30 flex items-center justify-center"
                        animate={{ 
                          y: [0, 5, 0],
                          borderColor: ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.6)', 'rgba(16, 185, 129, 0.3)'],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent border-t-emerald-400" />
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CARDS FLYING PHASE */}
          <AnimatePresence>
            {(phase === 'cards-flying' || phase === 'selection') && (
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Energy burst from center */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 4, opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                >
                  <div 
                    className="w-40 h-40 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(16, 185, 129, 0.6) 0%, transparent 70%)',
                    }}
                  />
                </motion.div>

                {/* Flying cards */}
                {flyingCards.map((card) => {
                  const startX = (Math.random() - 0.5) * 100;
                  const endX = (Math.random() - 0.5) * (isMobile ? 400 : 800);
                  const endY = -(Math.random() * 200 + 100);
                  
                  return (
                    <motion.div
                      key={card.id}
                      className="absolute top-1/2 left-1/2 rounded-xl overflow-hidden"
                      style={{
                        width: isMobile ? 80 : 120,
                        height: isMobile ? 110 : 160,
                        boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${rarityColors[card.game.rarity].glow}`,
                      }}
                      initial={{ 
                        x: startX, 
                        y: 50, 
                        scale: 0.3, 
                        opacity: 0,
                        rotateX: 0,
                        rotateY: 0,
                        rotateZ: card.angle,
                      }}
                      animate={{
                        x: phase === 'selection' ? 0 : endX,
                        y: phase === 'selection' ? 0 : endY,
                        scale: phase === 'selection' ? 0 : 1,
                        opacity: phase === 'selection' ? 0 : [0, 1, 1, 0],
                        rotateX: [0, Math.random() * 360],
                        rotateY: [0, Math.random() * 360],
                        rotateZ: [card.angle, card.angle + (Math.random() - 0.5) * 180],
                      }}
                      transition={{
                        duration: 1.8,
                        delay: card.delay,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                    >
                      <img 
                        src={card.game.image} 
                        alt={card.game.name}
                        className="w-full h-full object-cover"
                      />
                      <div 
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(135deg, transparent 30%, ${rarityColors[card.game.rarity].primary}40 100%)`,
                        }}
                      />
                    </motion.div>
                  );
                })}

                {/* Selection text */}
                {phase === 'selection' && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.div
                      className="text-xl md:text-2xl tracking-[0.4em] text-emerald-400/80 font-mono"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      SELECTING...
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* REVEAL PHASE */}
          <AnimatePresence>
            {phase === 'reveal' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Rarity glow background */}
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                  style={{
                    background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${rarityConfig.glow} 0%, transparent 70%)`,
                  }}
                />

                {/* Light rays */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 origin-center"
                      style={{
                        width: '200vmax',
                        height: 2,
                        marginLeft: '-100vmax',
                        background: `linear-gradient(90deg, transparent 0%, ${rarityConfig.primary}30 50%, transparent 100%)`,
                        transform: `rotate(${i * 30}deg)`,
                      }}
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: [0, 0.8, 0.4], scaleX: [0, 1, 1] }}
                      transition={{ duration: 1.5, delay: 0.2 + i * 0.05 }}
                    />
                  ))}
                </div>

                {/* Floating particles */}
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: Math.random() * 6 + 2,
                      height: Math.random() * 6 + 2,
                      background: rarityConfig.primary,
                      left: '50%',
                      top: '50%',
                    }}
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      opacity: 0,
                      scale: 0,
                    }}
                    animate={{ 
                      x: (Math.random() - 0.5) * 400,
                      y: (Math.random() - 0.5) * 400,
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 2,
                      delay: 0.5 + i * 0.05,
                      ease: "easeOut",
                    }}
                  />
                ))}

                {/* Main card reveal */}
                <motion.div
                  className="relative"
                  initial={{ scale: 0.3, rotateY: 180, opacity: 0 }}
                  animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                  transition={{ 
                    duration: 1.2, 
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  style={{ perspective: '1000px' }}
                >
                  {/* Card glow */}
                  <motion.div
                    className="absolute -inset-8 rounded-3xl"
                    style={{
                      background: `radial-gradient(ellipse at center, ${rarityConfig.glow} 0%, transparent 70%)`,
                    }}
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  {/* The card */}
                  <motion.div
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                      width: isMobile ? 200 : 280,
                      height: isMobile ? 280 : 380,
                      boxShadow: `
                        0 25px 80px rgba(0,0,0,0.6),
                        0 0 60px ${rarityConfig.glow},
                        inset 0 1px 0 rgba(255,255,255,0.1)
                      `,
                      border: `2px solid ${rarityConfig.primary}`,
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <img 
                      src={selectedGame.image} 
                      alt={selectedGame.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Holographic overlay */}
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, transparent 0%, ${rarityConfig.primary}20 50%, transparent 100%)`,
                      }}
                      animate={{
                        backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />

                    {/* Shine sweep */}
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
                        backgroundSize: '200% 100%',
                      }}
                      animate={{
                        backgroundPosition: ['-100% 0', '200% 0'],
                      }}
                      transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    />

                    {/* Rarity badge */}
                    <motion.div
                      className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      style={{
                        background: `${rarityConfig.primary}cc`,
                        color: '#fff',
                        boxShadow: `0 0 20px ${rarityConfig.glow}`,
                      }}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                    >
                      {selectedGame.rarity}
                    </motion.div>
                  </motion.div>

                  {/* Game name */}
                  <motion.div
                    className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-center w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                  >
                    <motion.h2
                      className="text-2xl md:text-4xl font-bold tracking-wide"
                      style={{
                        color: rarityConfig.primary,
                        textShadow: `0 0 30px ${rarityConfig.glow}`,
                      }}
                    >
                      {selectedGame.name}
                    </motion.h2>
                    <motion.p
                      className="text-sm md:text-base text-white/50 mt-2 tracking-widest uppercase"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.3 }}
                    >
                      Added to your library
                    </motion.p>
                  </motion.div>
                </motion.div>

                {/* Click to continue */}
                <motion.div
                  className="absolute bottom-12 left-1/2 -translate-x-1/2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 2 }}
                  onClick={handleSkip}
                >
                  <motion.div
                    className="text-xs tracking-[0.3em] text-white/50 cursor-pointer hover:text-white/80 transition-colors"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    CLICK TO CONTINUE
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroAnimation;
