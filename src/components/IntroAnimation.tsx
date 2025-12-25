import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { CreditCard, Check, Key, Zap } from "lucide-react";
import game1 from "@/assets/game-1.jpg";
import game2 from "@/assets/game-2.jpg";
import game3 from "@/assets/game-3.jpg";
import game4 from "@/assets/game-4.jpg";
import game5 from "@/assets/game-5.jpg";
import game6 from "@/assets/game-6.jpg";

const games = [
  { image: game1, name: "Elden Ring", price: "49.99" },
  { image: game2, name: "Cyberpunk 2077", price: "39.99" },
  { image: game3, name: "God of War", price: "44.99" },
  { image: game4, name: "Hogwarts Legacy", price: "54.99" },
  { image: game5, name: "Red Dead 2", price: "34.99" },
  { image: game6, name: "Baldur's Gate 3", price: "59.99" },
];

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<'scanning' | 'locking' | 'locked' | 'payment' | 'delivery' | 'transition' | 'complete'>('scanning');
  const [selectedGame] = useState(() => games[Math.floor(Math.random() * games.length)]);
  const [scanPosition, setScanPosition] = useState({ x: 0, y: 0 });
  const [generatedKey, setGeneratedKey] = useState('');
  const isMobile = useIsMobile();

  // Generate random game key
  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];
    for (let s = 0; s < 4; s++) {
      let segment = '';
      for (let i = 0; i < 5; i++) {
        segment += chars[Math.floor(Math.random() * chars.length)];
      }
      segments.push(segment);
    }
    setGeneratedKey(segments.join('-'));
  }, []);

  // Scanning animation - moving the scope around
  useEffect(() => {
    if (phase !== 'scanning') return;
    
    const interval = setInterval(() => {
      setScanPosition({
        x: (Math.random() - 0.5) * 150,
        y: (Math.random() - 0.5) * 100,
      });
    }, 400);

    const lockTimer = setTimeout(() => setPhase('locking'), 2000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(lockTimer);
    };
  }, [phase]);

  // Phase progression
  useEffect(() => {
    if (phase === 'locking') {
      const timer = setTimeout(() => setPhase('locked'), 800);
      return () => clearTimeout(timer);
    }
    if (phase === 'locked') {
      const timer = setTimeout(() => setPhase('payment'), 600);
      return () => clearTimeout(timer);
    }
    if (phase === 'payment') {
      const timer = setTimeout(() => setPhase('delivery'), 2000);
      return () => clearTimeout(timer);
    }
    if (phase === 'delivery') {
      const timer = setTimeout(() => setPhase('transition'), 2500);
      return () => clearTimeout(timer);
    }
    if (phase === 'transition') {
      const timer = setTimeout(() => setPhase('complete'), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === 'complete') {
      onComplete();
    }
  }, [phase, onComplete]);

  const handleSkip = useCallback(() => {
    setPhase('transition');
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { 
      if (e.key === 'Escape' || e.key === ' ') handleSkip(); 
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSkip]);

  // Step indicator logic
  const stepConfig = useMemo(() => {
    const phaseStr = phase as string;
    return ['Choose', 'Pay', 'Play'].map((step, i) => ({
      label: step,
      isActive: 
        (i === 0 && ['scanning', 'locking', 'locked'].includes(phaseStr)) ||
        (i === 1 && phaseStr === 'payment') ||
        (i === 2 && ['delivery', 'transition', 'complete'].includes(phaseStr)),
      isPast: 
        (i === 0 && ['payment', 'delivery', 'transition', 'complete'].includes(phaseStr)) ||
        (i === 1 && ['delivery', 'transition', 'complete'].includes(phaseStr)),
    }));
  }, [phase]);

  return (
    <AnimatePresence mode="wait">
      {phase !== 'complete' && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 1.1,
            filter: 'blur(10px)',
          }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          style={{ 
            background: 'linear-gradient(180deg, #0a0a0f 0%, #0f1015 50%, #0a0a0f 100%)',
          }}
        >
          {/* Subtle grid background */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Skip hint */}
          <motion.button
            className="absolute top-6 right-6 z-50 text-xs tracking-widest text-white/30 hover:text-white/60 transition-colors font-mono"
            onClick={handleSkip}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            SKIP
          </motion.button>

          {/* Step indicators */}
          <motion.div 
            className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 md:gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {stepConfig.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2 md:gap-3">
                <motion.div className="flex flex-col items-center">
                  <motion.div 
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step.isPast 
                        ? 'bg-emerald-500 text-black' 
                        : step.isActive 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' 
                          : 'bg-white/5 text-white/30 border border-white/10'
                    }`}
                    animate={step.isActive && !step.isPast ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: step.isActive ? Infinity : 0 }}
                  >
                    {step.isPast ? <Check className="w-4 h-4" /> : i + 1}
                  </motion.div>
                  <span className={`text-[9px] md:text-[10px] mt-1 tracking-wider transition-colors ${
                    step.isActive || step.isPast ? 'text-white/60' : 'text-white/20'
                  }`}>{step.label}</span>
                </motion.div>
                {i < 2 && (
                  <div className={`w-6 md:w-8 h-[2px] rounded-full transition-colors ${
                    step.isPast ? 'bg-emerald-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </motion.div>

          {/* SCANNING & LOCKING PHASE - Scope View */}
          <AnimatePresence>
            {['scanning', 'locking', 'locked'].includes(phase) && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                exit={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 0.5 }}
              >
                {/* Scope overlay */}
                <div className="relative" style={{ width: isMobile ? 280 : 400, height: isMobile ? 280 : 400 }}>
                  {/* Outer scope ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
                    animate={phase === 'scanning' ? { 
                      borderColor: ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.5)', 'rgba(16, 185, 129, 0.3)'],
                    } : {
                      borderColor: 'rgba(16, 185, 129, 0.8)',
                      boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
                    }}
                    transition={{ duration: 1, repeat: phase === 'scanning' ? Infinity : 0 }}
                  />

                  {/* Scope vignette */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.8) 100%)',
                    }}
                  />

                  {/* Crosshair */}
                  <motion.div
                    className="absolute inset-0"
                    animate={phase === 'locking' || phase === 'locked' ? { scale: 0.9 } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Horizontal line */}
                    <div className="absolute top-1/2 left-4 right-4 h-[1px] bg-emerald-500/50" />
                    {/* Vertical line */}
                    <div className="absolute left-1/2 top-4 bottom-4 w-[1px] bg-emerald-500/50" />
                    
                    {/* Center diamond */}
                    <motion.div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-emerald-400 rotate-45"
                      animate={phase === 'locked' ? {
                        borderColor: '#10b981',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.8)',
                        scale: [1, 1.2, 1],
                      } : phase === 'locking' ? {
                        scale: [1, 0.8, 1],
                      } : {}}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Corner brackets */}
                    {[0, 90, 180, 270].map((rotation) => (
                      <motion.div
                        key={rotation}
                        className="absolute top-1/2 left-1/2 w-8 h-8"
                        style={{ 
                          transform: `translate(-50%, -50%) rotate(${rotation}deg) translate(${isMobile ? 80 : 120}px, 0)`,
                        }}
                        animate={phase === 'locked' ? { opacity: 1 } : { opacity: 0.5 }}
                      >
                        <div className="w-3 h-[2px] bg-emerald-400" />
                        <div className="w-[2px] h-3 bg-emerald-400" />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Target game preview - moves during scanning */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl overflow-hidden"
                    style={{
                      width: isMobile ? 120 : 160,
                      height: isMobile ? 160 : 220,
                    }}
                    animate={phase === 'scanning' ? {
                      x: scanPosition.x,
                      y: scanPosition.y,
                    } : {
                      x: 0,
                      y: 0,
                    }}
                    transition={{ 
                      type: phase === 'scanning' ? "spring" : "spring",
                      stiffness: phase === 'scanning' ? 100 : 300,
                      damping: phase === 'scanning' ? 15 : 20,
                    }}
                  >
                    <img 
                      src={selectedGame.image} 
                      alt={selectedGame.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Lock overlay */}
                    <AnimatePresence>
                      {phase === 'locked' && (
                        <motion.div
                          className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <Check className="w-12 h-12 text-emerald-400" />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Scanning indicator */}
                  {phase === 'scanning' && (
                    <motion.div
                      className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs tracking-[0.2em] text-emerald-400/80 font-mono">SCANNING</span>
                    </motion.div>
                  )}

                  {/* Locking indicator */}
                  {phase === 'locking' && (
                    <motion.div
                      className="absolute -bottom-12 left-1/2 -translate-x-1/2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span className="text-xs tracking-[0.2em] text-yellow-400 font-mono">LOCKING...</span>
                    </motion.div>
                  )}

                  {/* Locked indicator */}
                  {phase === 'locked' && (
                    <motion.div
                      className="absolute -bottom-12 left-1/2 -translate-x-1/2"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <span className="text-sm tracking-[0.2em] text-emerald-400 font-mono font-bold">TARGET LOCKED</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PAYMENT PHASE */}
          <AnimatePresence>
            {phase === 'payment' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  className="relative p-6 md:p-8 rounded-2xl"
                  style={{
                    width: isMobile ? 300 : 380,
                    background: 'linear-gradient(145deg, #1a1a24 0%, #12121a 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Game being purchased */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={selectedGame.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{selectedGame.name}</p>
                      <p className="text-white/40 text-sm">Digital Key</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold text-lg">${selectedGame.price}</p>
                    </div>
                  </div>

                  {/* Payment processing */}
                  <motion.div
                    className="flex items-center justify-center gap-3 py-4 rounded-xl"
                    style={{ background: 'rgba(16, 185, 129, 0.1)' }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <CreditCard className="w-5 h-5 text-emerald-400" />
                    </motion.div>
                    <motion.span
                      className="text-sm text-emerald-400 font-medium"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Processing payment...
                    </motion.span>
                  </motion.div>

                  {/* Progress bar */}
                  <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.8, ease: "easeInOut" }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* DELIVERY PHASE */}
          <AnimatePresence>
            {phase === 'delivery' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.4 }}
              >
                {/* Success glow */}
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                  }}
                />

                <motion.div
                  className="relative p-6 md:p-8 rounded-2xl"
                  style={{
                    width: isMobile ? 300 : 400,
                    background: 'linear-gradient(145deg, #1a1a24 0%, #12121a 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 60px rgba(16, 185, 129, 0.1)',
                  }}
                >
                  {/* Success header */}
                  <motion.div
                    className="flex items-center justify-center gap-3 mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                    >
                      <Zap className="w-5 h-5 text-black" />
                    </motion.div>
                    <div>
                      <p className="text-white font-bold">Instant Delivery!</p>
                      <p className="text-white/40 text-xs">Your key is ready</p>
                    </div>
                  </motion.div>

                  {/* Game info */}
                  <motion.div
                    className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="w-14 h-18 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={selectedGame.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{selectedGame.name}</p>
                      <p className="text-emerald-400 text-sm">${selectedGame.price}</p>
                    </div>
                  </motion.div>

                  {/* Key display */}
                  <motion.div
                    className="rounded-xl p-4"
                    style={{
                      background: 'linear-gradient(145deg, #0d1117 0%, #161b22 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-white/40 uppercase tracking-wider">Activation Key</span>
                    </div>
                    
                    <div className="font-mono text-base md:text-lg text-emerald-400 tracking-wider text-center py-2">
                      {generatedKey.split('').map((char, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 + i * 0.02 }}
                          style={{ textShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}
                        >
                          {char}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>

                  {/* Email note */}
                  <motion.p
                    className="text-center text-white/40 text-xs mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    Also sent to your email ✨
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TRANSITION PHASE - Smooth zoom out */}
          <AnimatePresence>
            {phase === 'transition' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              >
                <motion.div
                  className="text-center"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="text-2xl md:text-3xl font-bold tracking-wider text-emerald-400 mb-2"
                    style={{ textShadow: '0 0 30px rgba(16, 185, 129, 0.5)' }}
                  >
                    DinGaming
                  </motion.div>
                  <p className="text-white/40 text-sm tracking-widest">READY TO PLAY</p>
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
