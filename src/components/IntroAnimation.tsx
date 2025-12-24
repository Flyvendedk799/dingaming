import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
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
  common: { border: 'hsl(220 10% 40%)', glow: 'hsl(220 10% 40% / 0.3)' },
  rare: { border: 'hsl(210 100% 50%)', glow: 'hsl(210 100% 50% / 0.5)' },
  epic: { border: 'hsl(280 100% 60%)', glow: 'hsl(280 100% 60% / 0.5)' },
  legendary: { border: 'hsl(45 100% 50%)', glow: 'hsl(45 100% 50% / 0.6)' },
};

// Extended array for spinning
const createSpinArray = () => {
  const arr = [];
  for (let i = 0; i < 60; i++) {
    arr.push(games[i % games.length]);
  }
  return arr;
};
const spinGames = createSpinArray();

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<'countdown' | 'spinning' | 'slowdown' | 'landed' | 'flash' | 'reveal' | 'complete'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [spinOffset, setSpinOffset] = useState(0);
  const [screenShake, setScreenShake] = useState(false);
  const [nearMiss, setNearMiss] = useState(false);
  const speedRef = useRef(80);
  const spinRef = useRef(0);
  const cardWidth = 190;
  const targetOffset = cardWidth * 45; // Land on specific position

  // Countdown phase
  useEffect(() => {
    if (phase !== 'countdown') return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 600);
      return () => clearTimeout(timer);
    } else {
      setPhase('spinning');
    }
  }, [phase, countdown]);

  // Main spinning animation
  useEffect(() => {
    if (phase !== 'spinning' && phase !== 'slowdown') return;

    let animationId: number;
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      spinRef.current += speedRef.current * deltaTime * cardWidth;
      setSpinOffset(spinRef.current);

      // Trigger slowdown phase
      if (phase === 'spinning' && spinRef.current > cardWidth * 20) {
        setPhase('slowdown');
      }

      // Slowdown with tension
      if (phase === 'slowdown') {
        const distanceToTarget = targetOffset - spinRef.current;
        
        // Dynamic deceleration based on distance
        if (distanceToTarget > cardWidth * 5) {
          speedRef.current *= 0.992;
        } else if (distanceToTarget > cardWidth * 2) {
          speedRef.current *= 0.975;
          // Near miss tension - screen shake on passing legendary
          if (!nearMiss && Math.random() > 0.95) {
            setNearMiss(true);
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 150);
            setTimeout(() => setNearMiss(false), 300);
          }
        } else {
          speedRef.current *= 0.94; // Final dramatic slowdown
        }

        // Stop condition
        if (speedRef.current < 0.15 || spinRef.current >= targetOffset) {
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
  }, [phase]);

  // Phase transitions
  useEffect(() => {
    if (phase === 'landed') {
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 300);
      setTimeout(() => setPhase('flash'), 500);
    }
    if (phase === 'flash') {
      setTimeout(() => setPhase('reveal'), 400);
    }
    if (phase === 'reveal') {
      setTimeout(() => setPhase('complete'), 3000);
    }
    if (phase === 'complete') {
      onComplete();
    }
  }, [phase, onComplete]);

  // Skip on click/key
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

  return (
    <AnimatePresence>
      {phase !== 'complete' && (
        <motion.div
          className={`fixed inset-0 z-[100] bg-[#0a0a0f] overflow-hidden ${screenShake ? 'animate-shake' : ''}`}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          onClick={handleSkip}
          style={{
            cursor: 'pointer',
          }}
        >
          {/* Cinematic letterbox bars */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-black z-50" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-black z-50" />

          {/* Dynamic background */}
          <div className="absolute inset-0">
            {/* Radial gradient that pulses */}
            <motion.div
              className="absolute inset-0"
              animate={{
                background: phase === 'spinning' || phase === 'slowdown' ? [
                  'radial-gradient(ellipse 80% 50% at 50% 50%, hsl(142 70% 15% / 0.4) 0%, transparent 70%)',
                  'radial-gradient(ellipse 100% 60% at 50% 50%, hsl(142 70% 20% / 0.5) 0%, transparent 70%)',
                  'radial-gradient(ellipse 80% 50% at 50% 50%, hsl(142 70% 15% / 0.4) 0%, transparent 70%)',
                ] : 'radial-gradient(ellipse 80% 50% at 50% 50%, hsl(142 70% 15% / 0.4) 0%, transparent 70%)'
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />

            {/* Speed lines during spin */}
            {(phase === 'spinning' || phase === 'slowdown') && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-[1px] bg-gradient-to-r from-transparent via-success/30 to-transparent"
                    style={{
                      top: `${10 + i * 4}%`,
                      left: 0,
                      right: 0,
                    }}
                    animate={{
                      x: ['-100%', '100%'],
                      opacity: phase === 'spinning' ? 0.6 : 0.2,
                    }}
                    transition={{
                      duration: phase === 'spinning' ? 0.3 : 1,
                      repeat: Infinity,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Floating particles */}
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 4 + 2,
                  height: Math.random() * 4 + 2,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: i % 3 === 0 ? 'hsl(142 70% 50%)' : i % 3 === 1 ? 'hsl(45 100% 50%)' : 'hsl(280 100% 60%)',
                }}
                animate={{
                  y: [0, -50, 0],
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Skip hint */}
          <motion.div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 text-muted-foreground/50 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            Tryk for at skippe
          </motion.div>

          {/* COUNTDOWN PHASE */}
          {phase === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={countdown}
                  className="relative"
                  initial={{ scale: 2, opacity: 0, rotateX: -90 }}
                  animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                  exit={{ scale: 0.5, opacity: 0, rotateX: 90 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {countdown > 0 ? (
                    <span className="font-heading text-[200px] font-bold text-success"
                      style={{ textShadow: '0 0 100px hsl(142 70% 50% / 0.8), 0 0 200px hsl(142 70% 50% / 0.4)' }}>
                      {countdown}
                    </span>
                  ) : (
                    <motion.span 
                      className="font-heading text-6xl font-bold text-foreground tracking-widest"
                      animate={{ letterSpacing: ['0em', '0.3em', '0.1em'] }}
                      transition={{ duration: 0.5 }}
                    >
                      ÅBNER...
                    </motion.span>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Circular progress */}
              <svg className="absolute w-80 h-80" viewBox="0 0 100 100">
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="hsl(142 70% 50%)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5 }}
                  style={{ filter: 'drop-shadow(0 0 10px hsl(142 70% 50%))' }}
                />
              </svg>
            </div>
          )}

          {/* SPINNING PHASE */}
          {(phase === 'spinning' || phase === 'slowdown' || phase === 'landed') && (
            <div className="absolute inset-0 flex items-center justify-center perspective-1000">
              
              {/* Center selection indicator */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                {/* Top arrow */}
                <motion.div
                  className="absolute -top-16 left-1/2 -translate-x-1/2"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 0.4, repeat: Infinity }}
                >
                  <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[28px] border-t-success"
                    style={{ filter: 'drop-shadow(0 0 15px hsl(142 70% 50%))' }} />
                </motion.div>

                {/* Bottom arrow */}
                <motion.div
                  className="absolute -bottom-16 left-1/2 -translate-x-1/2"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.4, repeat: Infinity }}
                >
                  <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[28px] border-b-success"
                    style={{ filter: 'drop-shadow(0 0 15px hsl(142 70% 50%))' }} />
                </motion.div>

                {/* Selection box */}
                <motion.div
                  className="w-[180px] h-[240px] border-4 rounded-2xl"
                  style={{
                    borderColor: 'hsl(142 70% 50%)',
                    boxShadow: '0 0 30px hsl(142 70% 50% / 0.6), inset 0 0 30px hsl(142 70% 50% / 0.1)',
                  }}
                  animate={{
                    boxShadow: [
                      '0 0 30px hsl(142 70% 50% / 0.6), inset 0 0 30px hsl(142 70% 50% / 0.1)',
                      '0 0 60px hsl(142 70% 50% / 0.9), inset 0 0 50px hsl(142 70% 50% / 0.2)',
                      '0 0 30px hsl(142 70% 50% / 0.6), inset 0 0 30px hsl(142 70% 50% / 0.1)',
                    ],
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              </div>

              {/* Cards container with 3D effect */}
              <div 
                className="flex items-center gap-3 will-change-transform"
                style={{ 
                  transform: `translateX(${-spinOffset + window.innerWidth / 2 - 85}px)`,
                }}
              >
                {spinGames.map((game, index) => {
                  const rarity = rarityColors[game.rarity as keyof typeof rarityColors] || rarityColors.common;
                  return (
                    <motion.div
                      key={index}
                      className="flex-shrink-0 w-[170px] h-[220px] rounded-xl overflow-hidden relative"
                      style={{
                        background: `linear-gradient(145deg, hsl(220 20% 15%), hsl(220 20% 8%))`,
                        border: `3px solid ${rarity.border}`,
                        boxShadow: `0 0 20px ${rarity.glow}, 0 10px 40px hsl(0 0% 0% / 0.5)`,
                      }}
                    >
                      {/* Rarity glow overlay */}
                      <div 
                        className="absolute inset-0 opacity-20"
                        style={{ background: `radial-gradient(ellipse at top, ${rarity.glow}, transparent 60%)` }}
                      />
                      
                      <img
                        src={game.image}
                        alt={game.name}
                        className="w-full h-[160px] object-cover"
                      />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                        <p className="text-sm font-bold text-foreground truncate text-center">{game.name}</p>
                        <p className="text-xs text-center capitalize" style={{ color: rarity.border }}>{game.rarity}</p>
                      </div>

                      {/* Shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      />
                    </motion.div>
                  );
                })}

                {/* THE WINNING CARD - DinGaming */}
                <motion.div
                  className="flex-shrink-0 w-[170px] h-[220px] rounded-xl overflow-hidden relative"
                  style={{
                    background: 'linear-gradient(145deg, hsl(142 70% 15%), hsl(142 70% 8%))',
                    border: '4px solid hsl(142 70% 50%)',
                    boxShadow: '0 0 40px hsl(142 70% 50% / 0.7), 0 0 80px hsl(142 70% 50% / 0.3), 0 10px 40px hsl(0 0% 0% / 0.5)',
                  }}
                  animate={phase === 'landed' ? {
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      '0 0 40px hsl(142 70% 50% / 0.7), 0 0 80px hsl(142 70% 50% / 0.3)',
                      '0 0 80px hsl(142 70% 50% / 1), 0 0 150px hsl(142 70% 50% / 0.6)',
                      '0 0 40px hsl(142 70% 50% / 0.7), 0 0 80px hsl(142 70% 50% / 0.3)',
                    ],
                  } : {}}
                  transition={{ duration: 0.4 }}
                >
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-success/20 via-transparent to-success/10" />
                  
                  {/* Logo */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                      className="text-3xl font-heading font-bold mb-2"
                      animate={phase === 'landed' ? { scale: [1, 1.15, 1] } : {}}
                    >
                      <span className="text-foreground">Din</span>
                      <span className="text-success">Gaming</span>
                    </motion.div>
                    <div className="flex items-center gap-2 text-success/80 text-xs">
                      <span>★ LEGENDARY ★</span>
                    </div>
                  </div>

                  {/* Animated border shine */}
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(90deg, transparent, hsl(142 70% 50% / 0.5), transparent)',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>

                {/* More cards after */}
                {spinGames.slice(0, 15).map((game, index) => {
                  const rarity = rarityColors[game.rarity as keyof typeof rarityColors] || rarityColors.common;
                  return (
                    <motion.div
                      key={`after-${index}`}
                      className="flex-shrink-0 w-[170px] h-[220px] rounded-xl overflow-hidden relative"
                      style={{
                        background: `linear-gradient(145deg, hsl(220 20% 15%), hsl(220 20% 8%))`,
                        border: `3px solid ${rarity.border}`,
                        boxShadow: `0 0 20px ${rarity.glow}`,
                      }}
                    >
                      <img src={game.image} alt={game.name} className="w-full h-[160px] object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                        <p className="text-sm font-bold text-foreground truncate text-center">{game.name}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Edge fade */}
              <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent pointer-events-none z-20" />
              <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-l from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent pointer-events-none z-20" />
            </div>
          )}

          {/* LANDING EXPLOSION */}
          {(phase === 'landed' || phase === 'flash') && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Explosion particles */}
              {[...Array(60)].map((_, i) => {
                const angle = (i / 60) * Math.PI * 2;
                const distance = 200 + Math.random() * 300;
                return (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 rounded-full"
                    style={{
                      width: 4 + Math.random() * 8,
                      height: 4 + Math.random() * 8,
                      background: i % 2 === 0 ? 'hsl(142 70% 50%)' : 'hsl(45 100% 50%)',
                      boxShadow: i % 2 === 0 ? '0 0 10px hsl(142 70% 50%)' : '0 0 10px hsl(45 100% 50%)',
                    }}
                    initial={{ x: 0, y: 0, scale: 0 }}
                    animate={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance,
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                );
              })}

              {/* Light ring burst */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-success"
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ width: 800, height: 800, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ boxShadow: '0 0 40px hsl(142 70% 50%)' }}
              />
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent"
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ width: 600, height: 600, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              />
            </motion.div>
          )}

          {/* WHITE FLASH */}
          {phase === 'flash' && (
            <motion.div
              className="absolute inset-0 bg-white z-50"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          )}

          {/* EPIC REVEAL */}
          {phase === 'reveal' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Radial god rays */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 h-[200vh] w-8"
                    style={{
                      background: 'linear-gradient(to top, transparent, hsl(142 70% 50% / 0.1), transparent)',
                      transformOrigin: 'center bottom',
                      rotate: `${i * 30}deg`,
                    }}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.8 }}
                  />
                ))}
              </div>

              {/* Main content */}
              <div className="relative z-10 text-center">
                {/* Massive glow */}
                <motion.div
                  className="absolute -inset-40 blur-[100px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                  style={{ background: 'radial-gradient(circle, hsl(142 70% 50% / 0.5) 0%, transparent 70%)' }}
                />

                {/* Logo with 3D effect */}
                <motion.div
                  className="relative"
                  initial={{ scale: 0, rotateX: -90, opacity: 0 }}
                  animate={{ scale: 1, rotateX: 0, opacity: 1 }}
                  transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                >
                  <motion.h1
                    className="font-heading text-8xl md:text-[180px] font-bold leading-none"
                    style={{
                      textShadow: '0 0 60px hsl(142 70% 50% / 0.8), 0 0 120px hsl(142 70% 50% / 0.4), 0 20px 60px hsl(0 0% 0% / 0.5)',
                    }}
                    animate={{
                      textShadow: [
                        '0 0 60px hsl(142 70% 50% / 0.8), 0 0 120px hsl(142 70% 50% / 0.4)',
                        '0 0 100px hsl(142 70% 50% / 1), 0 0 200px hsl(142 70% 50% / 0.6)',
                        '0 0 60px hsl(142 70% 50% / 0.8), 0 0 120px hsl(142 70% 50% / 0.4)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-foreground">Din</span>
                    <span className="text-gradient-success">Gaming</span>
                  </motion.h1>
                </motion.div>

                {/* Tagline */}
                <motion.p
                  className="text-2xl md:text-4xl text-muted-foreground mt-8 font-medium tracking-wide"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  Velkommen til dit Gaming Univers
                </motion.p>

                {/* Animated underline */}
                <motion.div
                  className="mx-auto mt-6 h-1 bg-gradient-to-r from-transparent via-success to-transparent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: 300 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                />

                {/* Loading indicator */}
                <motion.div
                  className="mt-12 flex items-center justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 rounded-full bg-success"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </motion.div>
              </div>

              {/* Floating game cards in background */}
              {games.map((game, i) => (
                <motion.div
                  key={i}
                  className="absolute w-24 h-32 rounded-lg overflow-hidden border-2 border-success/20"
                  style={{
                    left: `${10 + (i % 3) * 35}%`,
                    top: `${15 + Math.floor(i / 3) * 50}%`,
                  }}
                  initial={{ opacity: 0, scale: 0, rotate: Math.random() * 30 - 15 }}
                  animate={{ 
                    opacity: 0.4, 
                    scale: 1,
                    y: [0, -15, 0],
                  }}
                  transition={{ 
                    delay: 0.5 + i * 0.15,
                    y: { duration: 3, repeat: Infinity, delay: i * 0.3 }
                  }}
                >
                  <img src={game.image} alt="" className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Sound visualization bars */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-end gap-[3px] z-30">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="w-[3px] rounded-full"
                style={{ background: 'linear-gradient(to top, hsl(142 70% 50%), hsl(142 70% 30%))' }}
                animate={{
                  height: phase === 'spinning' 
                    ? [8, 25 + Math.random() * 35, 8]
                    : phase === 'slowdown'
                    ? [6, 15 + Math.random() * 20, 6]
                    : [4, 8, 4],
                }}
                transition={{
                  duration: phase === 'spinning' ? 0.15 : 0.3,
                  repeat: Infinity,
                  delay: i * 0.03,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroAnimation;