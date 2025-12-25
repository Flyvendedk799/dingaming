import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import game1 from "@/assets/game-1.jpg";
import game2 from "@/assets/game-2.jpg";
import game3 from "@/assets/game-3.jpg";
import game4 from "@/assets/game-4.jpg";
import game5 from "@/assets/game-5.jpg";
import game6 from "@/assets/game-6.jpg";

const games = [
  { image: game1, name: "Elden Ring", rarity: "epic" },
  { image: game2, name: "Cyberpunk 2077", rarity: "rare" },
  { image: game3, name: "God of War", rarity: "epic" },
  { image: game4, name: "Hogwarts Legacy", rarity: "rare" },
  { image: game5, name: "Red Dead 2", rarity: "legendary" },
  { image: game6, name: "Baldur's Gate 3", rarity: "legendary" },
];

const rarityConfig = {
  common: { color: '#6b7280', glow: 'rgba(107, 114, 128, 0.4)' },
  rare: { color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
  epic: { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' },
  legendary: { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)' },
};

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<'boot' | 'countdown' | 'spinning' | 'slowdown' | 'landed' | 'explosion' | 'reveal' | 'complete'>('boot');
  const [countdown, setCountdown] = useState(3);
  const [spinOffset, setSpinOffset] = useState(0);
  const [intensity, setIntensity] = useState(0);
  const isMobile = useIsMobile();
  const speedRef = useRef(55);
  const spinRef = useRef(0);
  
  const cardWidth = isMobile ? 100 : 150;
  const cardHeight = isMobile ? 140 : 200;
  const gap = isMobile ? 10 : 14;
  const totalWidth = cardWidth + gap;
  const targetOffset = useMemo(() => totalWidth * 42, [totalWidth]);
  
  const spinGames = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 55; i++) arr.push({ ...games[i % games.length], index: i });
    return arr;
  }, []);

  // Boot sequence
  useEffect(() => {
    const timer = setTimeout(() => setPhase('countdown'), 800);
    return () => clearTimeout(timer);
  }, []);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 800);
      return () => clearTimeout(timer);
    }
    setTimeout(() => setPhase('spinning'), 500);
  }, [phase, countdown]);

  // Spinning animation
  useEffect(() => {
    if (phase !== 'spinning' && phase !== 'slowdown') return;
    
    let animationId: number;
    let lastTime = performance.now();
    
    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.04);
      lastTime = time;
      
      spinRef.current += speedRef.current * delta * totalWidth;
      setSpinOffset(spinRef.current);
      setIntensity(Math.min(speedRef.current / 55, 1));
      
      if (phase === 'spinning' && spinRef.current > totalWidth * 15) {
        setPhase('slowdown');
      }
      
      if (phase === 'slowdown') {
        const dist = targetOffset - spinRef.current;
        if (dist > totalWidth * 6) speedRef.current *= 0.994;
        else if (dist > totalWidth * 2) speedRef.current *= 0.98;
        else speedRef.current *= 0.93;
        
        if (speedRef.current < 0.1 || spinRef.current >= targetOffset) {
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
  }, [phase, targetOffset, totalWidth]);

  // Phase transitions
  useEffect(() => {
    if (phase === 'landed') setTimeout(() => setPhase('explosion'), 100);
    if (phase === 'explosion') setTimeout(() => setPhase('reveal'), 800);
    if (phase === 'reveal') setTimeout(() => setPhase('complete'), 2800);
    if (phase === 'complete') onComplete();
  }, [phase, onComplete]);

  const handleSkip = useCallback(() => {
    if (phase !== 'complete') setPhase('complete');
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === ' ') handleSkip(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSkip]);

  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 - cardWidth / 2 : 500;

  return (
    <AnimatePresence>
      {phase !== 'complete' && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden cursor-pointer"
          onClick={handleSkip}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Deep space background */}
          <div className="absolute inset-0 bg-[#030308]">
            {/* Nebula effect */}
            <div 
              className="absolute inset-0 opacity-60"
              style={{
                background: `
                  radial-gradient(ellipse 120% 80% at 20% 80%, rgba(88, 28, 135, 0.15) 0%, transparent 50%),
                  radial-gradient(ellipse 100% 100% at 80% 20%, rgba(30, 58, 138, 0.12) 0%, transparent 50%),
                  radial-gradient(ellipse 80% 60% at 50% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 60%)
                `
              }}
            />
            
            {/* Star field */}
            <div className="absolute inset-0">
              {[...Array(60)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: Math.random() > 0.8 ? 2 : 1,
                    height: Math.random() > 0.8 ? 2 : 1,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    opacity: [0.2, 0.8, 0.2],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            {/* Dynamic energy during spin */}
            {(phase === 'spinning' || phase === 'slowdown') && (
              <>
                {/* Horizontal energy streaks */}
                <motion.div 
                  className="absolute inset-0 pointer-events-none"
                  animate={{ opacity: intensity }}
                >
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute h-[1px]"
                      style={{
                        top: `${15 + i * 6}%`,
                        left: 0,
                        right: 0,
                        background: `linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, ${0.3 * intensity}) 30%, rgba(16, 185, 129, ${0.5 * intensity}) 50%, rgba(16, 185, 129, ${0.3 * intensity}) 70%, transparent 100%)`,
                      }}
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 0.4 / Math.max(intensity, 0.3),
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 0.03,
                      }}
                    />
                  ))}
                </motion.div>

                {/* Vortex glow */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    width: '140vw',
                    height: '100vh',
                    background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(16, 185, 129, ${0.15 * intensity}) 0%, transparent 70%)`,
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              </>
            )}
          </div>

          {/* Cinematic bars */}
          <motion.div 
            className="absolute top-0 left-0 right-0 bg-black z-50"
            initial={{ height: 0 }}
            animate={{ height: isMobile ? 40 : 60 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 right-0 bg-black z-50"
            initial={{ height: 0 }}
            animate={{ height: isMobile ? 40 : 60 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />

          {/* BOOT PHASE */}
          {phase === 'boot' && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="relative"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Initializing text */}
                <motion.div
                  className="text-emerald-500/60 text-sm tracking-[0.3em] font-mono"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  INITIALIZING
                </motion.div>
                
                {/* Loading bar */}
                <div className="mt-4 w-48 h-0.5 bg-emerald-900/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* COUNTDOWN PHASE */}
          <AnimatePresence mode="wait">
            {phase === 'countdown' && (
              <motion.div
                key="countdown"
                className="absolute inset-0 flex items-center justify-center z-40"
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  {/* Outer ring pulse */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 rounded-full"
                    style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 0, 0.3],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  
                  {/* Inner ring */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-56 md:h-56 rounded-full border-2 border-emerald-500/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    {/* Orbit dots */}
                    {[0, 90, 180, 270].map((deg) => (
                      <div
                        key={deg}
                        className="absolute w-2 h-2 bg-emerald-400 rounded-full"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `rotate(${deg}deg) translateX(${isMobile ? 96 : 112}px) translateY(-50%)`,
                          boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)',
                        }}
                      />
                    ))}
                  </motion.div>

                  {/* Progress arc */}
                  <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 md:w-64 md:h-64 -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="48%"
                      fill="none"
                      stroke="rgba(16, 185, 129, 0.15)"
                      strokeWidth="3"
                    />
                    <motion.circle
                      cx="50%"
                      cy="50%"
                      r="48%"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: (3 - countdown) / 3 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Number */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={countdown}
                      className="relative z-10 text-center"
                      initial={{ scale: 2, opacity: 0, filter: 'blur(20px)' }}
                      animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {countdown > 0 ? (
                        <span 
                          className="font-heading text-[100px] md:text-[140px] font-bold text-transparent bg-clip-text"
                          style={{
                            backgroundImage: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                            filter: 'drop-shadow(0 0 60px rgba(16, 185, 129, 0.5))',
                            lineHeight: 1,
                          }}
                        >
                          {countdown}
                        </span>
                      ) : (
                        <motion.span
                          className="text-2xl md:text-3xl font-bold text-emerald-400 tracking-[0.5em] font-mono"
                          animate={{ 
                            textShadow: [
                              '0 0 20px rgba(16, 185, 129, 0.5)',
                              '0 0 40px rgba(16, 185, 129, 0.8)',
                              '0 0 20px rgba(16, 185, 129, 0.5)',
                            ]
                          }}
                          transition={{ duration: 0.3, repeat: 3 }}
                        >
                          SPIN
                        </motion.span>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SPINNING PHASE */}
          {(phase === 'spinning' || phase === 'slowdown' || phase === 'landed' || phase === 'explosion') && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '1200px' }}>
              
              {/* Selection frame */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                {/* Scanner beam effect */}
                <motion.div
                  className="absolute inset-0 overflow-hidden rounded-2xl"
                  style={{ width: cardWidth + 20, height: cardHeight + 20, marginLeft: -10, marginTop: -10 }}
                >
                  <motion.div
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                    animate={{ top: ['-10%', '110%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>

                {/* Corner brackets */}
                {[
                  { top: -4, left: -4, rotate: 0 },
                  { top: -4, right: -4, rotate: 90 },
                  { bottom: -4, right: -4, rotate: 180 },
                  { bottom: -4, left: -4, rotate: 270 },
                ].map((pos, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-6 h-6"
                    style={{
                      ...pos,
                      transform: `rotate(${pos.rotate}deg)`,
                    }}
                    animate={phase === 'landed' || phase === 'explosion' ? {
                      scale: [1, 1.2, 1],
                    } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-400" style={{ boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)' }} />
                    <div className="absolute top-0 left-0 w-[3px] h-full bg-emerald-400" style={{ boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)' }} />
                  </motion.div>
                ))}

                {/* Frame glow */}
                <motion.div
                  className="absolute rounded-2xl"
                  style={{
                    inset: -2,
                    border: '2px solid rgba(16, 185, 129, 0.4)',
                    boxShadow: `
                      0 0 20px rgba(16, 185, 129, 0.3),
                      inset 0 0 20px rgba(16, 185, 129, 0.1)
                    `,
                  }}
                  animate={(phase === 'landed' || phase === 'explosion') ? {
                    boxShadow: [
                      '0 0 20px rgba(16, 185, 129, 0.3), inset 0 0 20px rgba(16, 185, 129, 0.1)',
                      '0 0 60px rgba(16, 185, 129, 0.8), inset 0 0 40px rgba(16, 185, 129, 0.3)',
                      '0 0 20px rgba(16, 185, 129, 0.3), inset 0 0 20px rgba(16, 185, 129, 0.1)',
                    ]
                  } : {}}
                  transition={{ duration: 0.4, repeat: phase === 'explosion' ? 3 : 0 }}
                />
              </div>

              {/* Cards container */}
              <div 
                className="flex items-center will-change-transform"
                style={{ 
                  gap,
                  transform: `translate3d(${-spinOffset + centerX}px, 0, 0)`,
                }}
              >
                {spinGames.map((game, idx) => {
                  const config = rarityConfig[game.rarity as keyof typeof rarityConfig];
                  return (
                    <div
                      key={idx}
                      className="flex-shrink-0 rounded-xl overflow-hidden relative"
                      style={{
                        width: cardWidth,
                        height: cardHeight,
                        background: 'linear-gradient(145deg, #1a1a2e 0%, #0f0f1a 100%)',
                        border: `2px solid ${config.color}40`,
                        boxShadow: `0 0 20px ${config.glow}, 0 10px 30px rgba(0,0,0,0.5)`,
                      }}
                    >
                      {/* Holographic overlay */}
                      <div 
                        className="absolute inset-0 opacity-30"
                        style={{
                          background: `linear-gradient(135deg, ${config.color}20 0%, transparent 50%, ${config.color}10 100%)`,
                        }}
                      />
                      
                      <img
                        src={game.image}
                        alt={game.name}
                        className="w-full object-cover"
                        style={{ height: cardHeight - 50 }}
                      />
                      
                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black via-black/90 to-transparent">
                        <p className="text-xs md:text-sm font-bold text-white/90 text-center truncate">{game.name}</p>
                        <p 
                          className="text-[10px] text-center uppercase tracking-wider font-medium"
                          style={{ color: config.color }}
                        >
                          {game.rarity}
                        </p>
                      </div>

                      {/* Card shine */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent"
                        initial={{ x: '-100%', y: '-100%' }}
                        animate={{ x: '200%', y: '200%' }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                      />
                    </div>
                  );
                })}

                {/* WINNING CARD */}
                <motion.div
                  className="flex-shrink-0 rounded-xl overflow-hidden relative"
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                    background: 'linear-gradient(145deg, #0d3320 0%, #052e16 100%)',
                    border: '2px solid #10b981',
                    boxShadow: '0 0 40px rgba(16, 185, 129, 0.5), 0 0 80px rgba(16, 185, 129, 0.2)',
                  }}
                  animate={(phase === 'landed' || phase === 'explosion') ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 via-transparent to-emerald-500/10" />
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div 
                      className="font-heading text-lg md:text-2xl font-bold"
                      animate={(phase === 'landed' || phase === 'explosion') ? { scale: [1, 1.1, 1] } : {}}
                    >
                      <span className="text-white">Din</span>
                      <span className="text-emerald-400">Gaming</span>
                    </motion.div>
                    <div className="text-emerald-400/70 text-[10px] tracking-[0.2em] mt-1">★ LEGENDARY ★</div>
                  </div>

                  {/* Rotating border shine */}
                  <motion.div
                    className="absolute inset-0 rounded-xl overflow-hidden"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <div 
                      className="absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.6), transparent)' }}
                    />
                  </motion.div>
                </motion.div>

                {/* After cards */}
                {spinGames.slice(0, 12).map((game, idx) => {
                  const config = rarityConfig[game.rarity as keyof typeof rarityConfig];
                  return (
                    <div
                      key={`after-${idx}`}
                      className="flex-shrink-0 rounded-xl overflow-hidden relative"
                      style={{
                        width: cardWidth,
                        height: cardHeight,
                        background: 'linear-gradient(145deg, #1a1a2e 0%, #0f0f1a 100%)',
                        border: `2px solid ${config.color}40`,
                        boxShadow: `0 0 15px ${config.glow}`,
                      }}
                    >
                      <img src={game.image} alt="" className="w-full object-cover" style={{ height: cardHeight - 50 }} />
                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black to-transparent">
                        <p className="text-xs font-bold text-white/90 text-center truncate">{game.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Edge masks */}
              <div className="absolute inset-y-0 left-0 w-40 md:w-64 bg-gradient-to-r from-[#030308] via-[#030308]/80 to-transparent pointer-events-none z-20" />
              <div className="absolute inset-y-0 right-0 w-40 md:w-64 bg-gradient-to-l from-[#030308] via-[#030308]/80 to-transparent pointer-events-none z-20" />
            </div>
          )}

          {/* EXPLOSION PHASE */}
          <AnimatePresence>
            {phase === 'explosion' && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Radial burst */}
                {[...Array(32)].map((_, i) => {
                  const angle = (i / 32) * Math.PI * 2;
                  const dist = 200 + Math.random() * 250;
                  return (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 rounded-full will-change-transform"
                      style={{
                        width: 4 + Math.random() * 8,
                        height: 4 + Math.random() * 8,
                        background: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#f59e0b' : '#a855f7',
                        boxShadow: `0 0 10px currentColor`,
                      }}
                      initial={{ x: 0, y: 0, scale: 0 }}
                      animate={{
                        x: Math.cos(angle) * dist,
                        y: Math.sin(angle) * dist,
                        scale: [0, 1.5, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  );
                })}

                {/* Shockwave rings */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-400"
                  initial={{ width: 0, height: 0, opacity: 1 }}
                  animate={{ width: 600, height: 600, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)' }}
                />
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-400/50"
                  initial={{ width: 0, height: 0, opacity: 0.8 }}
                  animate={{ width: 400, height: 400, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                />

                {/* Flash */}
                <motion.div
                  className="absolute inset-0 bg-white"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
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
                transition={{ duration: 0.5 }}
              >
                {/* Background with gradient */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: `
                      radial-gradient(ellipse 80% 50% at 50% 50%, rgba(16, 185, 129, 0.12) 0%, transparent 60%),
                      linear-gradient(180deg, #030308 0%, #0a0a12 50%, #030308 100%)
                    `
                  }}
                />

                {/* Animated rays */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 origin-bottom"
                      style={{
                        width: 4,
                        height: '120vh',
                        background: 'linear-gradient(to top, transparent 0%, rgba(16, 185, 129, 0.06) 50%, transparent 100%)',
                        rotate: `${i * 60}deg`,
                        translateX: '-50%',
                      }}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.6 }}
                    />
                  ))}
                </div>

                {/* Main content */}
                <div className="relative z-10 text-center px-6">
                  {/* Glow orb */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 50%)',
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />

                  {/* Logo */}
                  <motion.h1
                    className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-[120px] font-bold relative"
                    initial={{ y: 40, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span 
                      className="text-white"
                      style={{ 
                        textShadow: '0 4px 30px rgba(0,0,0,0.5)',
                      }}
                    >
                      Din
                    </span>
                    <span 
                      className="text-transparent bg-clip-text"
                      style={{ 
                        backgroundImage: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #10b981 100%)',
                        filter: 'drop-shadow(0 0 40px rgba(16, 185, 129, 0.5))',
                      }}
                    >
                      Gaming
                    </span>
                  </motion.h1>

                  {/* Tagline */}
                  <motion.p
                    className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-400 mt-4 md:mt-6 tracking-wide"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    Velkommen til dit Gaming Univers
                  </motion.p>

                  {/* Accent line */}
                  <motion.div
                    className="mx-auto mt-6 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"
                    initial={{ width: 0 }}
                    animate={{ width: isMobile ? 180 : 300 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  />

                  {/* Loading */}
                  <motion.div
                    className="mt-8 flex items-center justify-center gap-1.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        animate={{
                          y: [0, -6, 0],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </motion.div>
                </div>

                {/* Floating game cards */}
                {games.slice(0, 4).map((game, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-14 h-18 md:w-16 md:h-20 rounded-lg overflow-hidden border border-emerald-500/20"
                    style={{
                      left: i % 2 === 0 ? `${6 + i * 3}%` : `${82 - i * 3}%`,
                      top: `${25 + (i % 2) * 35}%`,
                    }}
                    initial={{ opacity: 0, scale: 0.8, rotate: -10 + Math.random() * 20 }}
                    animate={{ 
                      opacity: 0.4,
                      y: [0, -8, 0],
                    }}
                    transition={{ 
                      delay: 0.5 + i * 0.1,
                      y: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 },
                    }}
                  >
                    <img src={game.image} alt="" className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Audio visualizer */}
          {(phase === 'spinning' || phase === 'slowdown') && (
            <div className="absolute bottom-14 md:bottom-16 left-1/2 -translate-x-1/2 flex items-end gap-[2px] z-30">
              {[...Array(24)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[2px] rounded-full"
                  style={{ background: 'linear-gradient(to top, #10b981, #059669)' }}
                  animate={{
                    height: [4, 8 + Math.sin(i * 0.5) * 12 * intensity + Math.random() * 8, 4],
                  }}
                  transition={{
                    duration: 0.15,
                    repeat: Infinity,
                    delay: i * 0.015,
                  }}
                />
              ))}
            </div>
          )}

          {/* Skip hint */}
          <motion.div
            className="absolute bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 2 }}
          >
            <span className="text-[10px] md:text-xs text-gray-500 tracking-widest uppercase">tap to skip</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroAnimation;
