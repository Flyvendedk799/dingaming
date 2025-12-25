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

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<'init' | 'scanning' | 'locked' | 'payment' | 'delivery' | 'exit'>('init');
  const [selectedIndex] = useState(() => Math.floor(Math.random() * games.length));
  const selectedGame = games[selectedIndex];
  const [generatedKey, setGeneratedKey] = useState('');
  const [paymentProgress, setPaymentProgress] = useState(0);
  const isMobile = useIsMobile();

  // Positions for floating game cards (pre-calculated for smooth animation)
  const gamePositions = useMemo(() => {
    const radius = isMobile ? 90 : 130;
    return games.map((_, i) => {
      const angle = (i / games.length) * Math.PI * 2 - Math.PI / 2;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        rotation: (Math.random() - 0.5) * 10,
      };
    });
  }, [isMobile]);

  // Smooth scope position with spring physics
  const scopeX = useMotionValue(0);
  const scopeY = useMotionValue(0);
  const smoothX = useSpring(scopeX, { stiffness: 40, damping: 20, mass: 1 });
  const smoothY = useSpring(scopeY, { stiffness: 40, damping: 20, mass: 1 });
  
  // Rotation for scanning effect
  const scanRotation = useMotionValue(0);
  const smoothRotation = useSpring(scanRotation, { stiffness: 20, damping: 15 });

  // Generate key on mount
  useEffect(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    setGeneratedKey(
      Array.from({ length: 4 }, () =>
        Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      ).join('-')
    );
  }, []);

  // Phase: Init -> Scanning
  useEffect(() => {
    const timer = setTimeout(() => setPhase('scanning'), 300);
    return () => clearTimeout(timer);
  }, []);

  // Smooth scanning movement - scope moves between game cards
  useEffect(() => {
    if (phase !== 'scanning') return;

    let frame = 0;
    const totalFrames = 160;
    const gamesCount = games.length;
    
    const animate = () => {
      frame++;
      const progress = frame / totalFrames;
      
      // Move through each game position, spending time on each
      const cycleProgress = progress * 2; // Cycle through twice for more scanning feel
      const currentGameFloat = (cycleProgress * gamesCount) % gamesCount;
      const currentGame = Math.floor(currentGameFloat);
      const nextGame = (currentGame + 1) % gamesCount;
      const lerpFactor = currentGameFloat - currentGame;
      
      // Smooth interpolation between game positions
      const currentPos = gamePositions[currentGame];
      const nextPos = gamePositions[nextGame];
      
      // Add some organic wobble
      const wobbleX = Math.sin(frame * 0.08) * 8;
      const wobbleY = Math.cos(frame * 0.06) * 6;
      
      // As we get closer to end, converge toward selected game
      const convergeFactor = Math.max(0, (progress - 0.7) / 0.3);
      const selectedPos = gamePositions[selectedIndex];
      
      const targetX = currentPos.x + (nextPos.x - currentPos.x) * lerpFactor;
      const targetY = currentPos.y + (nextPos.y - currentPos.y) * lerpFactor;
      
      scopeX.set(
        targetX * (1 - convergeFactor) + selectedPos.x * convergeFactor + wobbleX * (1 - convergeFactor)
      );
      scopeY.set(
        targetY * (1 - convergeFactor) + selectedPos.y * convergeFactor + wobbleY * (1 - convergeFactor)
      );
      scanRotation.set(Math.sin(frame * 0.02) * 2 * (1 - convergeFactor));

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        // Lock onto selected game
        scopeX.set(selectedPos.x);
        scopeY.set(selectedPos.y);
        scanRotation.set(0);
        setTimeout(() => setPhase('locked'), 150);
      }
    };

    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase, scopeX, scopeY, scanRotation, gamePositions, selectedIndex]);

  // Phase progression
  useEffect(() => {
    if (phase === 'locked') {
      const timer = setTimeout(() => setPhase('payment'), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === 'payment') {
      // Animate payment progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2;
        setPaymentProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => setPhase('delivery'), 300);
        }
      }, 30);
      return () => clearInterval(interval);
    }
    if (phase === 'delivery') {
      const timer = setTimeout(() => setPhase('exit'), 3000);
      return () => clearTimeout(timer);
    }
    if (phase === 'exit') {
      const timer = setTimeout(() => onComplete(), 800);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  const handleSkip = useCallback(() => {
    setPhase('exit');
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') handleSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSkip]);

  // Step config
  const steps = useMemo(() => {
    const p = phase;
    return [
      { label: 'Vælg', active: ['init', 'scanning', 'locked'].includes(p), done: ['payment', 'delivery', 'exit'].includes(p) },
      { label: 'Betal', active: p === 'payment', done: ['delivery', 'exit'].includes(p) },
      { label: 'Spil', active: ['delivery', 'exit'].includes(p), done: false },
    ];
  }, [phase]);

  const scopeSize = isMobile ? 280 : 380;

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden bg-[#07070a]"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Ambient light */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 100% 100% at 50% 30%, rgba(16, 185, 129, 0.04) 0%, transparent 60%)',
            }}
          />

          {/* Skip */}
          <motion.button
            className="absolute top-5 right-5 z-50 px-3 py-1.5 text-[10px] tracking-[0.2em] text-white/25 hover:text-white/50 transition-colors uppercase font-medium"
            onClick={handleSkip}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Spring over
          </motion.button>

          {/* Steps */}
          <motion.div
            className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <motion.div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-500 ${
                      step.done
                        ? 'bg-emerald-500 border-emerald-500 text-black'
                        : step.active
                        ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-white/25'
                    }`}
                    animate={step.active && !step.done ? { 
                      boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0.3)', '0 0 0 8px rgba(16, 185, 129, 0)', '0 0 0 0 rgba(16, 185, 129, 0.3)'],
                    } : {}}
                    transition={{ duration: 1.5, repeat: step.active && !step.done ? Infinity : 0 }}
                  >
                    {step.done ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
                  </motion.div>
                  <span className={`text-[10px] mt-1.5 tracking-wider font-medium transition-colors duration-300 ${
                    step.active || step.done ? 'text-white/70' : 'text-white/20'
                  }`}>{step.label}</span>
                </div>
                {i < 2 && (
                  <motion.div 
                    className="w-8 h-[2px] rounded-full bg-white/10 overflow-hidden"
                  >
                    <motion.div
                      className="h-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: step.done ? '100%' : 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  </motion.div>
                )}
              </div>
            ))}
          </motion.div>

          {/* SCOPE VIEW */}
          <AnimatePresence mode="wait">
            {['init', 'scanning', 'locked'].includes(phase) && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              >
                <motion.div
                  className="relative"
                  style={{ 
                    width: scopeSize, 
                    height: scopeSize,
                    rotateZ: smoothRotation,
                  }}
                >
                  {/* Outer scope ring with glow */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: '3px solid rgba(16, 185, 129, 0.4)',
                      boxShadow: phase === 'locked' 
                        ? '0 0 40px rgba(16, 185, 129, 0.4), inset 0 0 60px rgba(16, 185, 129, 0.1)'
                        : '0 0 20px rgba(16, 185, 129, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.5)',
                    }}
                    animate={phase === 'locked' ? {
                      borderColor: 'rgba(16, 185, 129, 0.8)',
                    } : {}}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Inner ring */}
                  <div 
                    className="absolute rounded-full border border-emerald-500/20"
                    style={{
                      top: '10%', left: '10%', right: '10%', bottom: '10%',
                    }}
                  />

                  {/* Scope vignette */}
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.7) 80%, rgba(0,0,0,0.95) 100%)',
                    }}
                  />

                  {/* Crosshair lines */}
                  <svg className="absolute inset-0 w-full h-full">
                    {/* Horizontal */}
                    <line x1="8%" y1="50%" x2="40%" y2="50%" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="1" />
                    <line x1="60%" y1="50%" x2="92%" y2="50%" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="1" />
                    {/* Vertical */}
                    <line x1="50%" y1="8%" x2="50%" y2="40%" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="1" />
                    <line x1="50%" y1="60%" x2="50%" y2="92%" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="1" />
                    
                    {/* Tick marks */}
                    {[25, 35, 65, 75].map((pos) => (
                      <g key={`h-${pos}`}>
                        <line x1={`${pos}%`} y1="48%" x2={`${pos}%`} y2="52%" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
                      </g>
                    ))}
                    {[25, 35, 65, 75].map((pos) => (
                      <g key={`v-${pos}`}>
                        <line x1="48%" y1={`${pos}%`} x2="52%" y2={`${pos}%`} stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
                      </g>
                    ))}
                  </svg>

                  {/* Center reticle */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    animate={phase === 'locked' ? { scale: [1, 0.8, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      className="w-6 h-6 border-2 border-emerald-400 rotate-45"
                      animate={phase === 'locked' ? {
                        borderColor: '#10b981',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.8)',
                      } : {}}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.div>

                  {/* Corner brackets */}
                  {[
                    { top: '15%', left: '15%', rotate: 0 },
                    { top: '15%', right: '15%', rotate: 90 },
                    { bottom: '15%', right: '15%', rotate: 180 },
                    { bottom: '15%', left: '15%', rotate: 270 },
                  ].map((pos, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-6 h-6"
                      style={{ 
                        ...pos, 
                        transform: `rotate(${pos.rotate}deg)`,
                      }}
                      animate={phase === 'locked' ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400" />
                      <div className="absolute top-0 left-0 w-[2px] h-full bg-emerald-400" />
                    </motion.div>
                  ))}

                  {/* All game cards floating in circle */}
                  {games.map((game, i) => {
                    const pos = gamePositions[i];
                    const isSelected = i === selectedIndex;
                    const cardWidth = isMobile ? 70 : 95;
                    const cardHeight = isMobile ? 95 : 130;
                    
                    return (
                      <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 rounded-lg overflow-hidden"
                        style={{
                          width: cardWidth,
                          height: cardHeight,
                          marginLeft: -cardWidth / 2,
                          marginTop: -cardHeight / 2,
                          boxShadow: isSelected && phase === 'locked' 
                            ? '0 0 30px rgba(16, 185, 129, 0.6), 0 10px 30px rgba(0,0,0,0.4)'
                            : '0 8px 25px rgba(0,0,0,0.4)',
                        }}
                        initial={{ 
                          x: pos.x, 
                          y: pos.y, 
                          rotate: pos.rotation,
                          opacity: 0,
                          scale: 0.8,
                        }}
                        animate={{ 
                          x: pos.x, 
                          y: pos.y, 
                          rotate: phase === 'locked' ? 0 : pos.rotation,
                          opacity: phase === 'locked' ? (isSelected ? 1 : 0.3) : 1,
                          scale: phase === 'locked' ? (isSelected ? 1.15 : 0.85) : 1,
                          filter: phase === 'locked' && !isSelected ? 'grayscale(0.5) brightness(0.6)' : 'none',
                        }}
                        transition={{ 
                          duration: 0.4,
                          delay: phase === 'init' ? i * 0.08 : 0,
                        }}
                      >
                        <img
                          src={game.image}
                          alt={game.name}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Border highlight for selected */}
                        {isSelected && phase === 'locked' && (
                          <motion.div
                            className="absolute inset-0 border-2 border-emerald-400 rounded-lg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          />
                        )}
                        
                        {/* Lock overlay for selected */}
                        <AnimatePresence>
                          {isSelected && phase === 'locked' && (
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center"
                              style={{ background: 'rgba(16, 185, 129, 0.25)' }}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <motion.div
                                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-500 flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                              >
                                <Check className="w-5 h-5 md:w-6 md:h-6 text-black" strokeWidth={3} />
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}

                  {/* Scope crosshair that follows the scan */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 w-16 h-16 -ml-8 -mt-8 pointer-events-none"
                    style={{ x: smoothX, y: smoothY }}
                  >
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-emerald-400/60" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-emerald-400/60" />
                    <motion.div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border border-emerald-400 rotate-45"
                      animate={phase === 'locked' ? {
                        scale: [1, 1.3, 1],
                        borderColor: '#10b981',
                      } : {}}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.div>

                  {/* Status text */}
                  <motion.div
                    className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-2"
                  >
                    {phase === 'scanning' && (
                      <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        />
                        <span className="text-xs tracking-[0.25em] text-emerald-400/80 font-medium uppercase">
                          Scanner
                        </span>
                      </motion.div>
                    )}
                    {phase === 'locked' && (
                      <motion.span
                        className="text-sm tracking-[0.2em] text-emerald-400 font-bold uppercase"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ textShadow: '0 0 20px rgba(16, 185, 129, 0.6)' }}
                      >
                        Mål låst
                      </motion.span>
                    )}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PAYMENT */}
          <AnimatePresence mode="wait">
            {phase === 'payment' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center px-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <motion.div
                  className="w-full max-w-sm rounded-2xl p-6"
                  style={{
                    background: 'linear-gradient(145deg, rgba(20, 20, 28, 0.95) 0%, rgba(12, 12, 18, 0.95) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {/* Game row */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-18 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                      <img src={selectedGame.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{selectedGame.name}</p>
                      <p className="text-white/40 text-sm">Digital nøgle</p>
                    </div>
                    <p className="text-emerald-400 font-bold text-lg">{selectedGame.price} kr</p>
                  </div>

                  {/* Progress section */}
                  <div className="rounded-xl p-4" style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-white/60">Behandler betaling</span>
                      <span className="text-sm text-emerald-400 font-medium">{paymentProgress}%</span>
                    </div>
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          width: `${paymentProgress}%`,
                          background: 'linear-gradient(90deg, #10b981, #34d399)',
                          boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* DELIVERY */}
          <AnimatePresence mode="wait">
            {phase === 'delivery' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center px-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                {/* Success glow */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                  }}
                />

                <motion.div
                  className="w-full max-w-sm rounded-2xl p-6"
                  style={{
                    background: 'linear-gradient(145deg, rgba(20, 20, 28, 0.95) 0%, rgba(12, 12, 18, 0.95) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4), 0 0 80px rgba(16, 185, 129, 0.08)',
                  }}
                >
                  {/* Success header */}
                  <motion.div
                    className="flex items-center gap-3 mb-5"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <motion.div
                      className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    >
                      <Zap className="w-5 h-5 text-black" strokeWidth={2.5} />
                    </motion.div>
                    <div>
                      <p className="text-white font-bold">Øjeblikkelig levering!</p>
                      <p className="text-white/40 text-xs">Din nøgle er klar</p>
                    </div>
                  </motion.div>

                  {/* Game info */}
                  <motion.div
                    className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={selectedGame.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{selectedGame.name}</p>
                      <p className="text-emerald-400 text-xs">{selectedGame.price} kr</p>
                    </div>
                  </motion.div>

                  {/* Key */}
                  <motion.div
                    className="rounded-xl p-4"
                    style={{
                      background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.15)',
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Aktiveringsnøgle</span>
                    </div>
                    <div className="font-mono text-emerald-400 tracking-widest text-center py-1.5" style={{ fontSize: isMobile ? 14 : 16 }}>
                      {generatedKey.split('').map((char, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + i * 0.015 }}
                          style={{ textShadow: '0 0 12px rgba(16, 185, 129, 0.4)' }}
                        >
                          {char}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>

                  <motion.p
                    className="text-center text-white/30 text-xs mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    Også sendt til din email ✨
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        // Smooth exit - empty div that fades out
        <motion.div
          className="fixed inset-0 z-[100] bg-[#07070a]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={onComplete}
        />
      )}
    </AnimatePresence>
  );
};

export default IntroAnimation;
