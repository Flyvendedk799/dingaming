import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Mail, Check, Key } from "lucide-react";
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
  const [phase, setPhase] = useState<'waiting' | 'opening' | 'cards-flying' | 'selection' | 'reveal' | 'delivery' | 'complete'>('waiting');
  const [selectedGame, setSelectedGame] = useState(games[4]);
  const [flyingCards, setFlyingCards] = useState<Array<{ id: number; game: typeof games[0]; delay: number; angle: number }>>([]);
  const [generatedKey, setGeneratedKey] = useState('');
  const isMobile = useIsMobile();
  
  // Mouse tracking for 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 100, damping: 30 });
  
  const rotateX = useTransform(smoothMouseY, [-300, 300], [8, -8]);
  const rotateY = useTransform(smoothMouseX, [-400, 400], [-8, 8]);

  // Case lid animation
  const caseOpenSpring = useSpring(0, { stiffness: 80, damping: 15 });
  const lidRotateX = useTransform(caseOpenSpring, [0, 100], [0, -120]);

  // Generate a fake game key
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

  // Reveal to delivery transition
  useEffect(() => {
    if (phase === 'reveal') {
      const timer = setTimeout(() => setPhase('delivery'), 2500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Complete after delivery
  useEffect(() => {
    if (phase === 'delivery') {
      const timer = setTimeout(() => setPhase('complete'), 4000);
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
          </div>

          {/* Floating dust particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
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

          {/* Step indicators */}
          <motion.div 
            className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {['Choose', 'Pay', 'Play'].map((step, i) => {
              const phaseStr = phase as string;
              const isActive = 
                (i === 0 && ['waiting', 'opening', 'cards-flying', 'selection', 'reveal'].includes(phaseStr)) ||
                (i === 1 && phaseStr === 'delivery') ||
                (i === 2 && phaseStr === 'complete');
              const isPast = 
                (i === 0 && ['delivery', 'complete'].includes(phaseStr)) ||
                (i === 1 && phaseStr === 'complete');
              
              return (
                <div key={step} className="flex items-center gap-3">
                  <motion.div 
                    className="flex flex-col items-center"
                    animate={{ 
                      opacity: isActive || isPast ? 1 : 0.3,
                    }}
                  >
                    <motion.div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isPast ? 'bg-emerald-500 text-black' : isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' : 'bg-white/10 text-white/40'
                      }`}
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
                    >
                      {isPast ? <Check className="w-4 h-4" /> : i + 1}
                    </motion.div>
                    <span className="text-[10px] mt-1 tracking-wider text-white/60">{step}</span>
                  </motion.div>
                  {i < 2 && (
                    <motion.div 
                      className="w-8 h-[2px] rounded-full"
                      style={{ 
                        background: isPast ? '#10b981' : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  )}
                </div>
              );
            })}
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
                        {/* Key icon */}
                        <motion.div className="mb-2">
                          <svg 
                            width={isMobile ? 32 : 40} 
                            height={isMobile ? 32 : 40} 
                            viewBox="0 0 24 24" 
                            fill="none"
                            style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))' }}
                          >
                            <path 
                              d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" 
                              stroke="url(#keyGradient)" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                            <defs>
                              <linearGradient id="keyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#34d399" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </motion.div>
                        
                        <motion.div
                          className="text-xl md:text-2xl font-bold tracking-[0.15em]"
                          style={{
                            background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          DinGaming
                        </motion.div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-6 h-[1px] bg-gradient-to-r from-transparent to-emerald-500/50" />
                          <span className="text-[10px] tracking-[0.2em] text-emerald-500/60 uppercase">Digital Keys</span>
                          <div className="w-6 h-[1px] bg-gradient-to-l from-transparent to-emerald-500/50" />
                        </div>
                      </div>

                      {/* Lid inner face */}
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
                {/* Energy burst */}
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
                        rotateZ: card.angle,
                      }}
                      animate={{
                        x: phase === 'selection' ? 0 : endX,
                        y: phase === 'selection' ? 0 : endY,
                        scale: phase === 'selection' ? 0 : 1,
                        opacity: phase === 'selection' ? 0 : [0, 1, 1, 0],
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
                    </motion.div>
                  );
                })}

                {/* Selection text */}
                {phase === 'selection' && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
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
                exit={{ opacity: 0, scale: 0.9 }}
              >
                {/* Rarity glow */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${rarityConfig.glow} 0%, transparent 70%)`,
                  }}
                />

                {/* Main card */}
                <motion.div
                  className="relative"
                  initial={{ scale: 0.3, rotateY: 180, opacity: 0 }}
                  animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                  transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <motion.div
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                      width: isMobile ? 180 : 240,
                      height: isMobile ? 250 : 320,
                      boxShadow: `0 25px 80px rgba(0,0,0,0.6), 0 0 60px ${rarityConfig.glow}`,
                      border: `2px solid ${rarityConfig.primary}`,
                    }}
                  >
                    <img 
                      src={selectedGame.image} 
                      alt={selectedGame.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Shine */}
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
                        backgroundSize: '200% 100%',
                      }}
                      animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />

                    {/* Badge */}
                    <motion.div
                      className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase"
                      style={{
                        background: `${rarityConfig.primary}cc`,
                        color: '#fff',
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" }}
                    >
                      {selectedGame.rarity}
                    </motion.div>
                  </motion.div>

                  {/* Game name */}
                  <motion.div
                    className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <h2
                      className="text-xl md:text-2xl font-bold"
                      style={{ color: rarityConfig.primary }}
                    >
                      {selectedGame.name}
                    </h2>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* DELIVERY PHASE - Email with Key */}
          <AnimatePresence>
            {phase === 'delivery' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
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

                {/* Email envelope animation */}
                <motion.div
                  className="relative"
                  initial={{ y: 100, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  {/* Email card */}
                  <motion.div
                    className="relative rounded-2xl p-6 md:p-8"
                    style={{
                      width: isMobile ? 300 : 420,
                      background: 'linear-gradient(145deg, #1a1a24 0%, #12121a 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(16, 185, 129, 0.1)',
                    }}
                  >
                    {/* Email header */}
                    <motion.div
                      className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.div
                        className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center"
                        animate={{ 
                          boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0.4)', '0 0 0 10px rgba(16, 185, 129, 0)', '0 0 0 0 rgba(16, 185, 129, 0.4)'],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Mail className="w-5 h-5 text-emerald-400" />
                      </motion.div>
                      <div>
                        <p className="text-white font-medium text-sm">DinGaming</p>
                        <p className="text-white/40 text-xs">Your game key is ready!</p>
                      </div>
                      <motion.div
                        className="ml-auto"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8, type: "spring" }}
                      >
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-black" />
                        </div>
                      </motion.div>
                    </motion.div>

                    {/* Game info */}
                    <motion.div
                      className="flex items-center gap-4 mb-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div 
                        className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0"
                        style={{ boxShadow: `0 0 20px ${rarityConfig.glow}` }}
                      >
                        <img src={selectedGame.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{selectedGame.name}</p>
                        <p className="text-white/40 text-sm">Digital Key • Instant Delivery</p>
                      </div>
                    </motion.div>

                    {/* Key display */}
                    <motion.div
                      className="relative rounded-xl p-4"
                      style={{
                        background: 'linear-gradient(145deg, #0d1117 0%, #161b22 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                      }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-white/40 uppercase tracking-wider">Your Game Key</span>
                      </div>
                      
                      <motion.div
                        className="font-mono text-lg md:text-xl text-emerald-400 tracking-wider text-center py-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        style={{ textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}
                      >
                        {generatedKey.split('').map((char, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 + i * 0.03 }}
                          >
                            {char}
                          </motion.span>
                        ))}
                      </motion.div>
                    </motion.div>

                    {/* Success message */}
                    <motion.p
                      className="text-center text-white/50 text-sm mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.8 }}
                    >
                      Delivered instantly to your inbox ✨
                    </motion.p>
                  </motion.div>
                </motion.div>

                {/* Click to continue */}
                <motion.div
                  className="absolute bottom-12 left-1/2 -translate-x-1/2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 2.5 }}
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
