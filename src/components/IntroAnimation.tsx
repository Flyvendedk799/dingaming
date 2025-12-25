import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, Key, Zap } from "lucide-react";
import game1 from "@/assets/game-1.jpg";
import game2 from "@/assets/game-2.jpg";
import game3 from "@/assets/game-3.jpg";
import game4 from "@/assets/game-4.jpg";
import game5 from "@/assets/game-5.jpg";
import game6 from "@/assets/game-6.jpg";

const games = [
  { image: game1, name: "Elden Ring", price: "449" },
  { image: game2, name: "Cyberpunk 2077", price: "349" },
  { image: game3, name: "God of War", price: "399" },
  { image: game4, name: "Hogwarts Legacy", price: "499" },
  { image: game5, name: "Red Dead 2", price: "299" },
  { image: game6, name: "Baldur's Gate 3", price: "549" },
];

// Smooth easing curves - typed as tuples for framer-motion
const smoothEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
const snapEase: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<'init' | 'scanning' | 'locked' | 'payment' | 'delivery' | 'exit'>('init');
  const [selectedIndex] = useState(() => Math.floor(Math.random() * games.length));
  const selectedGame = games[selectedIndex];
  const [generatedKey, setGeneratedKey] = useState('');
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [hoveredGame, setHoveredGame] = useState(-1);
  const isMobile = useIsMobile();

  // Positions for floating game cards
  const gamePositions = useMemo(() => {
    const radius = isMobile ? 95 : 140;
    return games.map((_, i) => {
      const angle = (i / games.length) * Math.PI * 2 - Math.PI / 2;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        baseRotation: (i - 3) * 2,
      };
    });
  }, [isMobile]);

  // Buttery smooth scope movement
  const scopeX = useMotionValue(0);
  const scopeY = useMotionValue(0);
  const smoothX = useSpring(scopeX, { stiffness: 60, damping: 25, mass: 0.8 });
  const smoothY = useSpring(scopeY, { stiffness: 60, damping: 25, mass: 0.8 });

  // Generate key on mount
  useEffect(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    setGeneratedKey(
      Array.from({ length: 4 }, () =>
        Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      ).join('-')
    );
  }, []);

  // Phase: Init -> Scanning with delay for card entrance
  useEffect(() => {
    const timer = setTimeout(() => setPhase('scanning'), 600);
    return () => clearTimeout(timer);
  }, []);

  // Smooth scanning movement
  useEffect(() => {
    if (phase !== 'scanning') return;

    let frame = 0;
    const totalFrames = 180; // Slightly longer for smoother feel
    const gamesCount = games.length;
    let rafId: number;
    
    const animate = () => {
      frame++;
      const progress = frame / totalFrames;
      
      // Eased progress for natural deceleration
      const easedProgress = 1 - Math.pow(1 - progress, 2);
      
      // Scan through games with smooth sine interpolation
      const cycleProgress = easedProgress * 1.8;
      const currentGameFloat = (cycleProgress * gamesCount) % gamesCount;
      const currentGame = Math.floor(currentGameFloat);
      const nextGame = (currentGame + 1) % gamesCount;
      
      // Smooth step interpolation
      const t = currentGameFloat - currentGame;
      const smoothT = t * t * (3 - 2 * t); // Smoothstep
      
      const currentPos = gamePositions[currentGame];
      const nextPos = gamePositions[nextGame];
      
      // Organic micro-movement
      const microX = Math.sin(frame * 0.05) * 4 * (1 - easedProgress);
      const microY = Math.cos(frame * 0.04) * 3 * (1 - easedProgress);
      
      // Converge toward selected game in final phase
      const convergeFactor = Math.max(0, (progress - 0.75) / 0.25);
      const convergeEased = convergeFactor * convergeFactor;
      const selectedPos = gamePositions[selectedIndex];
      
      const scanX = currentPos.x + (nextPos.x - currentPos.x) * smoothT;
      const scanY = currentPos.y + (nextPos.y - currentPos.y) * smoothT;
      
      scopeX.set(scanX * (1 - convergeEased) + selectedPos.x * convergeEased + microX);
      scopeY.set(scanY * (1 - convergeEased) + selectedPos.y * convergeEased + microY);
      
      // Update hovered game for highlight effect
      if (!convergeEased) {
        setHoveredGame(currentGame);
      }

      if (frame < totalFrames) {
        rafId = requestAnimationFrame(animate);
      } else {
        scopeX.set(selectedPos.x);
        scopeY.set(selectedPos.y);
        setHoveredGame(selectedIndex);
        setTimeout(() => setPhase('locked'), 100);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [phase, scopeX, scopeY, gamePositions, selectedIndex]);

  // Phase progression with refined timing
  useEffect(() => {
    if (phase === 'locked') {
      const timer = setTimeout(() => setPhase('payment'), 1200);
      return () => clearTimeout(timer);
    }
    if (phase === 'payment') {
      let progress = 0;
      const interval = setInterval(() => {
        // Eased progress for more natural feel
        progress += 1.5 + (progress / 100) * 0.5;
        setPaymentProgress(Math.min(Math.round(progress), 100));
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => setPhase('delivery'), 400);
        }
      }, 25);
      return () => clearInterval(interval);
    }
    if (phase === 'delivery') {
      const timer = setTimeout(() => setPhase('exit'), 3200);
      return () => clearTimeout(timer);
    }
    if (phase === 'exit') {
      const timer = setTimeout(onComplete, 700);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  const handleSkip = useCallback(() => setPhase('exit'), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') handleSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSkip]);

  // Step config with smooth transitions
  const steps = useMemo(() => {
    const p = phase;
    return [
      { label: 'Vælg', active: ['init', 'scanning', 'locked'].includes(p), done: ['payment', 'delivery', 'exit'].includes(p) },
      { label: 'Betal', active: p === 'payment', done: ['delivery', 'exit'].includes(p) },
      { label: 'Spil', active: ['delivery', 'exit'].includes(p), done: false },
    ];
  }, [phase]);

  const scopeSize = isMobile ? 300 : 420;

  return (
    <AnimatePresence mode="wait">
      {phase !== 'exit' ? (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden"
          style={{ background: '#050508' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: smoothEase }}
        >
          {/* Subtle ambient gradient */}
          <motion.div 
            className="absolute inset-0 pointer-events-none"
            animate={{
              background: phase === 'locked' 
                ? 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(16, 185, 129, 0.06) 0%, transparent 60%)'
                : 'radial-gradient(ellipse 100% 80% at 50% 40%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)',
            }}
            transition={{ duration: 0.8 }}
          />

          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-0.5 rounded-full bg-emerald-400/40"
                style={{
                  left: `${10 + (i * 6) % 80}%`,
                  bottom: '-5%',
                }}
                animate={{
                  y: [0, -window.innerHeight * 1.1],
                  opacity: [0, 0.6, 0.6, 0],
                  x: [0, Math.sin(i) * 30],
                }}
                transition={{
                  duration: 8 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'linear',
                }}
              />
            ))}
          </div>

          {/* Skip button */}
          <motion.button
            className="absolute top-5 right-5 z-50 px-3 py-1.5 text-[10px] tracking-[0.2em] text-white/20 hover:text-white/50 transition-all duration-300 uppercase font-medium rounded-full border border-transparent hover:border-white/10"
            onClick={handleSkip}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            Spring over
          </motion.button>

          {/* Step indicators */}
          <motion.div
            className="absolute top-7 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: smoothEase }}
          >
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="flex flex-col items-center">
                  <motion.div
                    className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-500"
                    style={{
                      background: step.done 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : step.active 
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(255, 255, 255, 0.03)',
                      border: step.done 
                        ? 'none'
                        : step.active 
                          ? '1.5px solid rgba(16, 185, 129, 0.5)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                      color: step.done ? '#000' : step.active ? '#10b981' : 'rgba(255,255,255,0.25)',
                      boxShadow: step.active && !step.done ? '0 0 20px rgba(16, 185, 129, 0.2)' : 'none',
                    }}
                    animate={step.active && !step.done ? {
                      boxShadow: ['0 0 15px rgba(16, 185, 129, 0.15)', '0 0 25px rgba(16, 185, 129, 0.3)', '0 0 15px rgba(16, 185, 129, 0.15)'],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {step.done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
                  </motion.div>
                  <span className={`text-[9px] mt-1.5 tracking-wider font-medium transition-all duration-500 ${
                    step.active || step.done ? 'text-white/60' : 'text-white/20'
                  }`}>{step.label}</span>
                </div>
                {i < 2 && (
                  <div className="w-6 md:w-8 h-[1.5px] rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      initial={{ width: 0 }}
                      animate={{ width: step.done ? '100%' : 0 }}
                      transition={{ duration: 0.5, ease: smoothEase }}
                    />
                  </div>
                )}
              </div>
            ))}
          </motion.div>

          {/* SCOPE VIEW */}
          <AnimatePresence mode="wait">
            {['init', 'scanning', 'locked'].includes(phase) && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.08 }}
                transition={{ duration: 0.6, ease: smoothEase }}
              >
                <div className="relative" style={{ width: scopeSize, height: scopeSize }}>
                  
                  {/* Outer scope ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, transparent 65%, rgba(0,0,0,0.85) 100%)',
                    }}
                    animate={{
                      boxShadow: phase === 'locked'
                        ? 'inset 0 0 80px rgba(16, 185, 129, 0.15), 0 0 50px rgba(16, 185, 129, 0.2)'
                        : 'inset 0 0 60px rgba(0, 0, 0, 0.4)',
                    }}
                    transition={{ duration: 0.4 }}
                  />
                  
                  {/* Scope border rings */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: '2px solid rgba(16, 185, 129, 0.25)' }}
                    animate={{
                      borderColor: phase === 'locked' ? 'rgba(16, 185, 129, 0.6)' : 'rgba(16, 185, 129, 0.25)',
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  <div 
                    className="absolute rounded-full border border-emerald-500/10"
                    style={{ inset: '8%' }}
                  />
                  <div 
                    className="absolute rounded-full border border-emerald-500/5"
                    style={{ inset: '15%' }}
                  />

                  {/* Crosshair SVG */}
                  <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.5 }}>
                    {/* Main crosshair lines */}
                    <line x1="10%" y1="50%" x2="42%" y2="50%" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" />
                    <line x1="58%" y1="50%" x2="90%" y2="50%" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" />
                    <line x1="50%" y1="10%" x2="50%" y2="42%" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" />
                    <line x1="50%" y1="58%" x2="50%" y2="90%" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" />
                    
                    {/* Measurement ticks */}
                    {[20, 30, 70, 80].map((pos) => (
                      <g key={pos}>
                        <line x1={`${pos}%`} y1="48.5%" x2={`${pos}%`} y2="51.5%" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1" />
                        <line x1="48.5%" y1={`${pos}%`} x2="51.5%" y2={`${pos}%`} stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1" />
                      </g>
                    ))}
                    
                    {/* Center circle */}
                    <circle cx="50%" cy="50%" r="3%" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
                  </svg>

                  {/* Corner brackets with animation */}
                  {[
                    { top: '12%', left: '12%', rotate: 0 },
                    { top: '12%', right: '12%', rotate: 90 },
                    { bottom: '12%', right: '12%', rotate: 180 },
                    { bottom: '12%', left: '12%', rotate: 270 },
                  ].map((pos, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{ 
                        ...pos,
                        width: isMobile ? 16 : 20,
                        height: isMobile ? 16 : 20,
                        transform: `rotate(${pos.rotate}deg)`,
                      }}
                      animate={{
                        opacity: phase === 'locked' ? 1 : 0.35,
                        scale: phase === 'locked' ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.25, delay: phase === 'locked' ? i * 0.04 : 0 }}
                    >
                      <motion.div 
                        className="absolute top-0 left-0 h-[2px] bg-emerald-400"
                        style={{ width: '100%' }}
                        animate={{ 
                          boxShadow: phase === 'locked' ? '0 0 8px rgba(16, 185, 129, 0.8)' : 'none' 
                        }}
                      />
                      <motion.div 
                        className="absolute top-0 left-0 w-[2px] bg-emerald-400"
                        style={{ height: '100%' }}
                        animate={{ 
                          boxShadow: phase === 'locked' ? '0 0 8px rgba(16, 185, 129, 0.8)' : 'none' 
                        }}
                      />
                    </motion.div>
                  ))}

                  {/* Game cards */}
                  {games.map((game, i) => {
                    const pos = gamePositions[i];
                    const isSelected = i === selectedIndex;
                    const isHovered = i === hoveredGame && phase === 'scanning';
                    const cardW = isMobile ? 60 : 80;
                    const cardH = isMobile ? 80 : 110;
                    
                    return (
                      <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 rounded-lg overflow-hidden"
                        style={{
                          width: cardW,
                          height: cardH,
                          marginLeft: -cardW / 2,
                          marginTop: -cardH / 2,
                        }}
                        initial={{ 
                          x: pos.x, 
                          y: pos.y, 
                          rotate: pos.baseRotation,
                          opacity: 0,
                          scale: 0.6,
                        }}
                        animate={{ 
                          x: pos.x, 
                          y: pos.y, 
                          rotate: phase === 'locked' ? 0 : pos.baseRotation,
                          opacity: phase === 'locked' ? (isSelected ? 1 : 0.15) : (isHovered ? 1 : 0.7),
                          scale: phase === 'locked' 
                            ? (isSelected ? 1.25 : 0.7) 
                            : (isHovered ? 1.08 : 0.95),
                          filter: phase === 'locked' && !isSelected 
                            ? 'grayscale(0.7) brightness(0.4)' 
                            : 'none',
                        }}
                        transition={{ 
                          duration: phase === 'locked' ? 0.5 : 0.2,
                          delay: phase === 'init' ? 0.1 + i * 0.06 : 0,
                          ease: phase === 'locked' ? snapEase : smoothEase,
                        }}
                      >
                        {/* Card glow */}
                        <motion.div
                          className="absolute -inset-2 rounded-xl pointer-events-none"
                          animate={{
                            boxShadow: isSelected && phase === 'locked'
                              ? '0 0 40px rgba(16, 185, 129, 0.5), 0 15px 40px rgba(0,0,0,0.4)'
                              : isHovered
                                ? '0 0 20px rgba(16, 185, 129, 0.25), 0 10px 30px rgba(0,0,0,0.3)'
                                : '0 8px 20px rgba(0,0,0,0.4)',
                          }}
                          transition={{ duration: 0.2 }}
                        />
                        
                        <img
                          src={game.image}
                          alt={game.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        
                        {/* Selection border */}
                        <motion.div
                          className="absolute inset-0 rounded-lg pointer-events-none"
                          animate={{
                            boxShadow: isSelected && phase === 'locked'
                              ? 'inset 0 0 0 2px rgba(16, 185, 129, 0.9)'
                              : isHovered
                                ? 'inset 0 0 0 1px rgba(16, 185, 129, 0.4)'
                                : 'inset 0 0 0 0px transparent',
                          }}
                          transition={{ duration: 0.2 }}
                        />
                        
                        {/* Lock overlay */}
                        <AnimatePresence>
                          {isSelected && phase === 'locked' && (
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center rounded-lg"
                              style={{ background: 'rgba(16, 185, 129, 0.2)' }}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <motion.div
                                className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 15 }}
                              >
                                <Check className="w-4 h-4 md:w-5 md:h-5 text-black" strokeWidth={3} />
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}

                  {/* Scanning crosshair overlay */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 pointer-events-none"
                    style={{ 
                      x: smoothX, 
                      y: smoothY,
                      marginLeft: -20,
                      marginTop: -20,
                    }}
                  >
                    <motion.div
                      className="w-10 h-10 relative"
                      animate={{ 
                        opacity: phase === 'locked' ? 0 : 1,
                        scale: phase === 'locked' ? 0.5 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Scanning reticle */}
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald-400/80 to-transparent" />
                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 border border-emerald-400/80 rotate-45"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </motion.div>
                  </motion.div>

                  {/* Status text */}
                  <motion.div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                    <AnimatePresence mode="wait">
                      {phase === 'scanning' && (
                        <motion.div
                          key="scanning"
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                            animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <span className="text-[11px] tracking-[0.3em] text-emerald-400/70 font-medium uppercase">
                            Scanner
                          </span>
                        </motion.div>
                      )}
                      {phase === 'locked' && (
                        <motion.div
                          key="locked"
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3, ease: snapEase }}
                        >
                          <motion.div
                            className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                          >
                            <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />
                          </motion.div>
                          <span 
                            className="text-xs tracking-[0.2em] text-emerald-400 font-semibold uppercase"
                            style={{ textShadow: '0 0 15px rgba(16, 185, 129, 0.5)' }}
                          >
                            Mål låst
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PAYMENT */}
          <AnimatePresence mode="wait">
            {phase === 'payment' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center px-6"
                initial={{ opacity: 0, y: 25, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.45, ease: smoothEase }}
              >
                <motion.div
                  className="w-full max-w-sm rounded-2xl p-5 md:p-6"
                  style={{
                    background: 'linear-gradient(165deg, rgba(18, 18, 25, 0.98) 0%, rgba(10, 10, 14, 0.98) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.12)',
                    boxShadow: '0 30px 70px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.02)',
                  }}
                >
                  {/* Game preview */}
                  <div className="flex items-center gap-4 mb-5">
                    <motion.div 
                      className="w-14 h-[72px] rounded-lg overflow-hidden flex-shrink-0 shadow-lg"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <img src={selectedGame.image} alt="" className="w-full h-full object-cover" />
                    </motion.div>
                    <motion.div 
                      className="flex-1 min-w-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                    >
                      <p className="text-white font-semibold truncate">{selectedGame.name}</p>
                      <p className="text-white/35 text-sm">Digital nøgle</p>
                    </motion.div>
                    <motion.p 
                      className="text-emerald-400 font-bold text-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {selectedGame.price} kr
                    </motion.p>
                  </div>

                  {/* Progress */}
                  <motion.div 
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(16, 185, 129, 0.06)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-white/50">Behandler betaling</span>
                      <span className="text-sm text-emerald-400 font-medium tabular-nums">{paymentProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          width: `${paymentProgress}%`,
                          background: 'linear-gradient(90deg, #059669, #10b981, #34d399)',
                        }}
                        animate={{
                          boxShadow: paymentProgress > 0 ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none',
                        }}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* DELIVERY */}
          <AnimatePresence mode="wait">
            {phase === 'delivery' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center px-6"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.5, ease: smoothEase }}
              >
                {/* Success glow */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  style={{
                    background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 60%)',
                  }}
                />

                <motion.div
                  className="w-full max-w-sm rounded-2xl p-5 md:p-6"
                  style={{
                    background: 'linear-gradient(165deg, rgba(18, 18, 25, 0.98) 0%, rgba(10, 10, 14, 0.98) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    boxShadow: '0 30px 70px rgba(0, 0, 0, 0.5), 0 0 60px rgba(16, 185, 129, 0.06)',
                  }}
                >
                  {/* Success header */}
                  <motion.div
                    className="flex items-center gap-3 mb-5"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                  >
                    <motion.div
                      className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 250, damping: 15 }}
                    >
                      <Zap className="w-5 h-5 text-black" strokeWidth={2.5} />
                    </motion.div>
                    <div>
                      <p className="text-white font-bold">Øjeblikkelig levering!</p>
                      <p className="text-white/35 text-xs">Din nøgle er klar</p>
                    </div>
                  </motion.div>

                  {/* Game info */}
                  <motion.div
                    className="flex items-center gap-3 pb-4 mb-4 border-b border-white/8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="w-11 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                      <img src={selectedGame.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{selectedGame.name}</p>
                      <p className="text-emerald-400/80 text-xs">{selectedGame.price} kr</p>
                    </div>
                  </motion.div>

                  {/* Key display */}
                  <motion.div
                    className="rounded-xl p-4"
                    style={{
                      background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.12)',
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <Key className="w-3.5 h-3.5 text-emerald-400/70" />
                      <span className="text-[10px] text-white/35 uppercase tracking-[0.15em] font-medium">Aktiveringsnøgle</span>
                    </div>
                    <div 
                      className="font-mono text-emerald-400 tracking-[0.15em] text-center py-1"
                      style={{ fontSize: isMobile ? 13 : 15 }}
                    >
                      {generatedKey.split('').map((char, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: 0.55 + i * 0.012,
                            duration: 0.2,
                            ease: smoothEase,
                          }}
                          style={{ textShadow: '0 0 10px rgba(16, 185, 129, 0.35)' }}
                        >
                          {char}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>

                  <motion.p
                    className="text-center text-white/25 text-xs mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                  >
                    Også sendt til din email ✨
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          className="fixed inset-0 z-[100]"
          style={{ background: '#050508' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: smoothEase }}
          onAnimationComplete={onComplete}
        />
      )}
    </AnimatePresence>
  );
};

export default IntroAnimation;
