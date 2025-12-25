import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import game1 from "@/assets/game-1.jpg";
import game2 from "@/assets/game-2.jpg";
import game3 from "@/assets/game-3.jpg";
import game4 from "@/assets/game-4.jpg";
import game5 from "@/assets/game-5.jpg";
import game6 from "@/assets/game-6.jpg";

// Game data with rarity
const games = [
  { image: game1, name: "Elden Ring", rarity: "epic" },
  { image: game2, name: "Cyberpunk 2077", rarity: "rare" },
  { image: game3, name: "God of War", rarity: "epic" },
  { image: game4, name: "Hogwarts Legacy", rarity: "rare" },
  { image: game5, name: "Red Dead 2", rarity: "legendary" },
  { image: game6, name: "Baldur's Gate 3", rarity: "legendary" },
];

const rarityColors = {
  common: { border: 'hsl(220 10% 40%)', glow: 'hsl(220 10% 40% / 0.3)', gradient: 'from-slate-400/20 to-slate-600/10' },
  rare: { border: 'hsl(210 100% 50%)', glow: 'hsl(210 100% 50% / 0.5)', gradient: 'from-blue-400/30 to-blue-600/10' },
  epic: { border: 'hsl(280 100% 60%)', glow: 'hsl(280 100% 60% / 0.5)', gradient: 'from-purple-400/30 to-purple-600/10' },
  legendary: { border: 'hsl(45 100% 50%)', glow: 'hsl(45 100% 50% / 0.6)', gradient: 'from-amber-400/40 to-orange-600/10' },
};

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<'init' | 'countdown' | 'spinning' | 'slowdown' | 'landed' | 'reveal' | 'complete'>('init');
  const [countdown, setCountdown] = useState(3);
  const [spinOffset, setSpinOffset] = useState(0);
  const [screenShake, setScreenShake] = useState(false);
  const isMobile = useIsMobile();
  const speedRef = useRef(60);
  const spinRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Responsive card sizing
  const cardWidth = isMobile ? 110 : 160;
  const cardHeight = isMobile ? 150 : 200;
  const cardGap = isMobile ? 8 : 12;
  const totalCardWidth = cardWidth + cardGap;
  
  // Pre-calculate target - land on winning card (index 45)
  const targetIndex = 45;
  const targetOffset = useMemo(() => totalCardWidth * targetIndex, [totalCardWidth]);
  
  // Create spin array with memoization
  const spinGames = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 60; i++) {
      arr.push({ ...games[i % games.length], index: i });
    }
    return arr;
  }, []);

  // Start animation after brief init
  useEffect(() => {
    const timer = setTimeout(() => setPhase('countdown'), 300);
    return () => clearTimeout(timer);
  }, []);

  // Countdown phase
  useEffect(() => {
    if (phase !== 'countdown') return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 700);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setPhase('spinning'), 400);
    }
  }, [phase, countdown]);

  // Optimized spinning animation using RAF
  useEffect(() => {
    if (phase !== 'spinning' && phase !== 'slowdown') return;

    let animationId: number;
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.05); // Cap delta for consistency
      lastTime = currentTime;

      spinRef.current += speedRef.current * deltaTime * totalCardWidth;
      
      // Use transform for smooth updates (GPU accelerated)
      setSpinOffset(spinRef.current);

      // Trigger slowdown phase
      if (phase === 'spinning' && spinRef.current > totalCardWidth * 18) {
        setPhase('slowdown');
      }

      // Smooth deceleration curve
      if (phase === 'slowdown') {
        const distanceToTarget = targetOffset - spinRef.current;
        const progress = 1 - (distanceToTarget / (totalCardWidth * 27));
        
        // Eased deceleration
        if (distanceToTarget > totalCardWidth * 8) {
          speedRef.current *= 0.995;
        } else if (distanceToTarget > totalCardWidth * 3) {
          speedRef.current *= 0.985;
        } else if (distanceToTarget > totalCardWidth) {
          speedRef.current *= 0.96;
        } else {
          speedRef.current *= 0.9;
        }

        // Stop condition
        if (speedRef.current < 0.08 || spinRef.current >= targetOffset - 5) {
          spinRef.current = targetOffset;
          setSpinOffset(targetOffset);
          setPhase('landed');
          return;
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [phase, targetOffset, totalCardWidth]);

  // Phase transitions
  useEffect(() => {
    if (phase === 'landed') {
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 250);
      setTimeout(() => setPhase('reveal'), 600);
    }
    if (phase === 'reveal') {
      setTimeout(() => setPhase('complete'), 2500);
    }
    if (phase === 'complete') {
      onComplete();
    }
  }, [phase, onComplete]);

  // Skip handler
  const handleSkip = useCallback(() => {
    if (phase !== 'complete') {
      setPhase('complete');
    }
  }, [phase]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') handleSkip();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleSkip]);

  // Calculate center offset for cards
  const centerOffset = typeof window !== 'undefined' ? window.innerWidth / 2 - cardWidth / 2 : 500;

  return (
    <AnimatePresence>
      {phase !== 'complete' && (
        <motion.div
          ref={containerRef}
          className={`fixed inset-0 z-[100] overflow-hidden ${screenShake ? 'animate-shake' : ''}`}
          style={{ background: 'linear-gradient(180deg, hsl(220 20% 4%) 0%, hsl(220 25% 8%) 50%, hsl(220 20% 5%) 100%)' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          onClick={handleSkip}
        >
          {/* Cinematic letterbox */}
          <div className="absolute top-0 left-0 right-0 h-12 md:h-16 bg-black z-50" />
          <div className="absolute bottom-0 left-0 right-0 h-12 md:h-16 bg-black z-50" />

          {/* Ambient background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] rounded-full opacity-40"
              style={{
                background: 'radial-gradient(ellipse 50% 40% at 50% 50%, hsl(142 70% 20% / 0.4) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: phase === 'spinning' || phase === 'slowdown' ? [0.3, 0.5, 0.3] : 0.3,
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Subtle floating particles - reduced count for performance */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full will-change-transform"
                style={{
                  width: 3 + Math.random() * 3,
                  height: 3 + Math.random() * 3,
                  left: `${10 + Math.random() * 80}%`,
                  top: `${20 + Math.random() * 60}%`,
                  background: i % 2 === 0 ? 'hsl(142 70% 50%)' : 'hsl(45 100% 50%)',
                  boxShadow: `0 0 ${6 + i}px currentColor`,
                }}
                animate={{
                  y: [-20, 20, -20],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Skip hint */}
          <motion.div
            className="absolute bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 z-50 text-muted-foreground/40 text-xs md:text-sm tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            TAP TO SKIP
          </motion.div>

          {/* COUNTDOWN PHASE */}
          <AnimatePresence mode="wait">
            {phase === 'countdown' && (
              <motion.div
                key="countdown"
                className="absolute inset-0 flex items-center justify-center z-30"
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  {/* Pulsing ring */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <motion.div
                      className="w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-success/30"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.div>

                  {/* Countdown number */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={countdown}
                      className="relative z-10"
                      initial={{ scale: 0, opacity: 0, rotateY: -90 }}
                      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                      exit={{ scale: 0.5, opacity: 0, rotateY: 90 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {countdown > 0 ? (
                        <span
                          className="font-heading text-[120px] md:text-[180px] font-bold text-success block"
                          style={{ 
                            textShadow: '0 0 80px hsl(142 70% 50% / 0.8), 0 0 160px hsl(142 70% 50% / 0.4)',
                            lineHeight: 1,
                          }}
                        >
                          {countdown}
                        </span>
                      ) : (
                        <motion.span
                          className="font-heading text-3xl md:text-5xl font-bold text-foreground tracking-[0.3em] block"
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 0.5, repeat: 2 }}
                        >
                          GO!
                        </motion.span>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Circular progress */}
                  <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 md:w-72 md:h-72 -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="hsl(142 70% 30% / 0.3)"
                      strokeWidth="2"
                    />
                    <motion.circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="hsl(142 70% 50%)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: (3 - countdown) / 3 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{ filter: 'drop-shadow(0 0 8px hsl(142 70% 50%))' }}
                    />
                  </svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SPINNING PHASE */}
          {(phase === 'spinning' || phase === 'slowdown' || phase === 'landed') && (
            <div className="absolute inset-0 flex items-center justify-center">
              
              {/* Selection indicator */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                {/* Top marker */}
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 -top-8 md:-top-12"
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div 
                    className="w-0 h-0 border-l-[10px] md:border-l-[14px] border-r-[10px] md:border-r-[14px] border-t-[14px] md:border-t-[20px] border-l-transparent border-r-transparent border-t-success"
                    style={{ filter: 'drop-shadow(0 0 12px hsl(142 70% 50%))' }} 
                  />
                </motion.div>

                {/* Bottom marker */}
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 -bottom-8 md:-bottom-12"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div 
                    className="w-0 h-0 border-l-[10px] md:border-l-[14px] border-r-[10px] md:border-r-[14px] border-b-[14px] md:border-b-[20px] border-l-transparent border-r-transparent border-b-success"
                    style={{ filter: 'drop-shadow(0 0 12px hsl(142 70% 50%))' }} 
                  />
                </motion.div>

                {/* Selection frame */}
                <motion.div
                  className="rounded-xl md:rounded-2xl"
                  style={{
                    width: cardWidth + 16,
                    height: cardHeight + 16,
                    border: '3px solid hsl(142 70% 50%)',
                    boxShadow: '0 0 30px hsl(142 70% 50% / 0.5), inset 0 0 30px hsl(142 70% 50% / 0.1)',
                  }}
                  animate={phase === 'landed' ? {
                    boxShadow: [
                      '0 0 30px hsl(142 70% 50% / 0.5), inset 0 0 30px hsl(142 70% 50% / 0.1)',
                      '0 0 60px hsl(142 70% 50% / 0.8), inset 0 0 40px hsl(142 70% 50% / 0.2)',
                      '0 0 30px hsl(142 70% 50% / 0.5), inset 0 0 30px hsl(142 70% 50% / 0.1)',
                    ],
                  } : {}}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
              </div>

              {/* Cards strip - GPU accelerated transform */}
              <div 
                className="flex items-center will-change-transform"
                style={{ 
                  gap: cardGap,
                  transform: `translate3d(${-spinOffset + centerOffset}px, 0, 0)`,
                }}
              >
                {spinGames.map((game, index) => {
                  const rarity = rarityColors[game.rarity as keyof typeof rarityColors] || rarityColors.common;
                  return (
                    <div
                      key={index}
                      className="flex-shrink-0 rounded-xl overflow-hidden relative"
                      style={{
                        width: cardWidth,
                        height: cardHeight,
                        background: 'linear-gradient(145deg, hsl(220 20% 14%), hsl(220 20% 8%))',
                        border: `2px solid ${rarity.border}`,
                        boxShadow: `0 0 16px ${rarity.glow}, 0 8px 32px hsl(0 0% 0% / 0.4)`,
                      }}
                    >
                      {/* Rarity shimmer */}
                      <div 
                        className={`absolute inset-0 bg-gradient-to-b ${rarity.gradient} pointer-events-none`}
                      />
                      
                      <img
                        src={game.image}
                        alt={game.name}
                        className="w-full object-cover"
                        style={{ height: cardHeight - 45 }}
                        loading="eager"
                      />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                        <p className="text-xs md:text-sm font-bold text-foreground truncate text-center">{game.name}</p>
                        <p className="text-[9px] md:text-[10px] text-center capitalize tracking-wide" style={{ color: rarity.border }}>{game.rarity}</p>
                      </div>
                    </div>
                  );
                })}

                {/* THE WINNING CARD - DinGaming */}
                <motion.div
                  className="flex-shrink-0 rounded-xl overflow-hidden relative"
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                    background: 'linear-gradient(145deg, hsl(142 60% 12%), hsl(142 50% 6%))',
                    border: '3px solid hsl(142 70% 50%)',
                    boxShadow: '0 0 30px hsl(142 70% 50% / 0.6), 0 0 60px hsl(142 70% 50% / 0.2)',
                  }}
                  animate={phase === 'landed' ? {
                    scale: [1, 1.08, 1],
                  } : {}}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-success/25 via-transparent to-success/15" />
                  
                  {/* Logo content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-heading font-bold text-xl md:text-2xl mb-1">
                      <span className="text-foreground">Din</span>
                      <span className="text-success">Gaming</span>
                    </div>
                    <div className="text-success/70 text-[9px] md:text-[10px] tracking-widest">
                      ★ LEGENDARY ★
                    </div>
                  </div>

                  {/* Rotating shine */}
                  <motion.div
                    className="absolute inset-0 overflow-hidden rounded-xl"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <div 
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full"
                      style={{ background: 'linear-gradient(180deg, transparent 0%, hsl(142 70% 50% / 0.4) 50%, transparent 100%)' }}
                    />
                  </motion.div>
                </motion.div>

                {/* Cards after winning card */}
                {spinGames.slice(0, 14).map((game, index) => {
                  const rarity = rarityColors[game.rarity as keyof typeof rarityColors] || rarityColors.common;
                  return (
                    <div
                      key={`after-${index}`}
                      className="flex-shrink-0 rounded-xl overflow-hidden relative"
                      style={{
                        width: cardWidth,
                        height: cardHeight,
                        background: 'linear-gradient(145deg, hsl(220 20% 14%), hsl(220 20% 8%))',
                        border: `2px solid ${rarity.border}`,
                        boxShadow: `0 0 16px ${rarity.glow}`,
                      }}
                    >
                      <img 
                        src={game.image} 
                        alt={game.name} 
                        className="w-full object-cover" 
                        style={{ height: cardHeight - 45 }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/95 to-transparent">
                        <p className="text-xs md:text-sm font-bold text-foreground truncate text-center">{game.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Edge fades */}
              <div className="absolute inset-y-0 left-0 w-32 md:w-48 bg-gradient-to-r from-[hsl(220_20%_6%)] via-[hsl(220_20%_6%/0.8)] to-transparent pointer-events-none z-20" />
              <div className="absolute inset-y-0 right-0 w-32 md:w-48 bg-gradient-to-l from-[hsl(220_20%_6%)] via-[hsl(220_20%_6%/0.8)] to-transparent pointer-events-none z-20" />
            </div>
          )}

          {/* LANDING BURST EFFECT */}
          <AnimatePresence>
            {phase === 'landed' && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Particle burst - optimized count */}
                {[...Array(24)].map((_, i) => {
                  const angle = (i / 24) * Math.PI * 2;
                  const distance = 150 + Math.random() * 200;
                  return (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 rounded-full will-change-transform"
                      style={{
                        width: 4 + Math.random() * 6,
                        height: 4 + Math.random() * 6,
                        background: i % 2 === 0 ? 'hsl(142 70% 55%)' : 'hsl(45 100% 55%)',
                        boxShadow: `0 0 8px ${i % 2 === 0 ? 'hsl(142 70% 50%)' : 'hsl(45 100% 50%)'}`,
                      }}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                      animate={{
                        x: Math.cos(angle) * distance,
                        y: Math.sin(angle) * distance,
                        scale: [0, 1.2, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  );
                })}

                {/* Expanding ring */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-success"
                  initial={{ width: 0, height: 0, opacity: 1 }}
                  animate={{ width: 500, height: 500, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ boxShadow: '0 0 30px hsl(142 70% 50%)' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* REVEAL PHASE */}
          <AnimatePresence>
            {phase === 'reveal' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, hsl(142 50% 8% / 0.95) 0%, hsl(220 20% 4%) 100%)' }}
              >
                {/* Radial rays */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 h-[150vh] w-6 origin-bottom"
                      style={{
                        background: 'linear-gradient(to top, transparent 0%, hsl(142 70% 50% / 0.08) 50%, transparent 100%)',
                        rotate: `${i * 45}deg`,
                        translateX: '-50%',
                      }}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ delay: i * 0.05, duration: 0.6, ease: "easeOut" }}
                    />
                  ))}
                </div>

                {/* Main logo reveal */}
                <div className="relative z-10 text-center px-4">
                  {/* Large glow behind */}
                  <motion.div
                    className="absolute -inset-32 md:-inset-48 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, hsl(142 70% 40% / 0.4) 0%, transparent 60%)' }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />

                  {/* Logo */}
                  <motion.h1
                    className="font-heading text-6xl sm:text-7xl md:text-8xl lg:text-[140px] font-bold leading-none relative"
                    initial={{ scale: 0.5, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      textShadow: '0 0 60px hsl(142 70% 50% / 0.6), 0 0 120px hsl(142 70% 50% / 0.3)',
                    }}
                  >
                    <span className="text-foreground">Din</span>
                    <span className="text-success">Gaming</span>
                  </motion.h1>

                  {/* Tagline */}
                  <motion.p
                    className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground/80 mt-4 md:mt-6 font-medium tracking-wide"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    Velkommen til dit Gaming Univers
                  </motion.p>

                  {/* Accent line */}
                  <motion.div
                    className="mx-auto mt-4 md:mt-6 h-0.5 bg-gradient-to-r from-transparent via-success to-transparent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: isMobile ? 200 : 280 }}
                    transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
                  />

                  {/* Loading dots */}
                  <motion.div
                    className="mt-8 md:mt-10 flex items-center justify-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-success"
                        animate={{ 
                          scale: [1, 1.4, 1],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{ 
                          duration: 0.8, 
                          repeat: Infinity, 
                          delay: i * 0.15,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </motion.div>
                </div>

                {/* Floating background cards */}
                {games.slice(0, 4).map((game, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-16 h-20 md:w-20 md:h-24 rounded-lg overflow-hidden border border-success/20 opacity-30"
                    style={{
                      left: `${8 + (i % 2) * 75}%`,
                      top: `${20 + Math.floor(i / 2) * 45}%`,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 0.25,
                      y: [0, -10, 0],
                    }}
                    transition={{ 
                      delay: 0.3 + i * 0.1,
                      y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    }}
                  >
                    <img src={game.image} alt="" className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Audio visualizer bars */}
          {(phase === 'spinning' || phase === 'slowdown') && (
            <div className="absolute bottom-14 md:bottom-20 left-1/2 -translate-x-1/2 flex items-end gap-[2px] z-30">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[2px] md:w-[3px] rounded-full bg-success/60"
                  animate={{
                    height: phase === 'spinning' 
                      ? [6, 20 + (i % 3) * 10, 6]
                      : [4, 12 + (i % 2) * 6, 4],
                  }}
                  transition={{
                    duration: phase === 'spinning' ? 0.15 : 0.25,
                    repeat: Infinity,
                    delay: i * 0.02,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroAnimation;
