import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
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
  const [selectedGame] = useState(() => games[Math.floor(Math.random() * games.length)]);
  const [generatedKey, setGeneratedKey] = useState('');
  const [paymentProgress, setPaymentProgress] = useState(0);
  const isMobile = useIsMobile();

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

  // Smooth scanning movement
  useEffect(() => {
    if (phase !== 'scanning') return;

    let frame = 0;
    const animate = () => {
      frame++;
      // Smooth figure-8 / infinity pattern that converges to center
      const progress = Math.min(frame / 120, 1);
      const decay = 1 - progress * 0.9;
      const speed = 0.02;
      
      scopeX.set(Math.sin(frame * speed) * 80 * decay + Math.sin(frame * speed * 2.3) * 30 * decay);
      scopeY.set(Math.cos(frame * speed * 1.7) * 50 * decay + Math.cos(frame * speed * 0.7) * 20 * decay);
      scanRotation.set(Math.sin(frame * 0.01) * 3);

      if (frame < 140) {
        requestAnimationFrame(animate);
      } else {
        // Converge to center
        scopeX.set(0);
        scopeY.set(0);
        scanRotation.set(0);
        setTimeout(() => setPhase('locked'), 200);
      }
    };

    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase, scopeX, scopeY, scanRotation]);

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

                  {/* Target game image */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 rounded-xl overflow-hidden shadow-2xl"
                    style={{
                      width: isMobile ? 100 : 140,
                      height: isMobile ? 140 : 190,
                      x: useTransform(smoothX, (v) => v - (isMobile ? 50 : 70)),
                      y: useTransform(smoothY, (v) => v - (isMobile ? 70 : 95)),
                    }}
                  >
                    <motion.img
                      src={selectedGame.image}
                      alt={selectedGame.name}
                      className="w-full h-full object-cover"
                      animate={phase === 'locked' ? { scale: 1.05 } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    
                    {/* Lock overlay */}
                    <AnimatePresence>
                      {phase === 'locked' && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ background: 'rgba(16, 185, 129, 0.2)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <motion.div
                            className="w-14 h-14 rounded-full bg-emerald-500/90 flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                          >
                            <Check className="w-7 h-7 text-black" strokeWidth={3} />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
