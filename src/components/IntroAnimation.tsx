import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface IntroAnimationProps {
  onComplete: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
  depth: number; // 0 = back, 1 = mid, 2 = front
  targetX: number;
  targetY: number;
}

// Key shape coordinates (simplified silhouette)
const keyShapePoints = [
  // Head of key (circle points)
  { x: 0, y: -35 }, { x: 15, y: -32 }, { x: 22, y: -20 }, { x: 22, y: -5 },
  { x: 15, y: 7 }, { x: 0, y: 10 }, { x: -15, y: 7 }, { x: -22, y: -5 },
  { x: -22, y: -20 }, { x: -15, y: -32 },
  // Shaft
  { x: -5, y: 15 }, { x: 5, y: 15 }, { x: 5, y: 45 }, { x: -5, y: 45 },
  // Teeth
  { x: 5, y: 30 }, { x: 15, y: 30 }, { x: 15, y: 38 }, { x: 5, y: 38 },
  { x: 5, y: 42 }, { x: 12, y: 42 }, { x: 12, y: 48 }, { x: -5, y: 48 },
];

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<'spark' | 'formation' | 'transform' | 'exit'>('spark');
  const isMobile = useIsMobile();
  const particleCount = isMobile ? 45 : 70;

  // Generate particles with random properties
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const keyPoint = keyShapePoints[i % keyShapePoints.length];
      const jitter = 8;
      return {
        id: i,
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        size: 3 + Math.random() * 5,
        opacity: 0.4 + Math.random() * 0.6,
        delay: Math.random() * 0.3,
        depth: Math.floor(Math.random() * 3),
        targetX: keyPoint.x + (Math.random() - 0.5) * jitter,
        targetY: keyPoint.y + (Math.random() - 0.5) * jitter,
      };
    });
  }, [particleCount]);

  // Phase progression
  useEffect(() => {
    const timings = {
      spark: 600,
      formation: 1200,
      transform: 1000,
      exit: 700,
    };

    if (phase === 'spark') {
      const timer = setTimeout(() => setPhase('formation'), timings.spark);
      return () => clearTimeout(timer);
    }
    if (phase === 'formation') {
      const timer = setTimeout(() => setPhase('transform'), timings.formation);
      return () => clearTimeout(timer);
    }
    if (phase === 'transform') {
      const timer = setTimeout(() => setPhase('exit'), timings.transform);
      return () => clearTimeout(timer);
    }
    if (phase === 'exit') {
      const timer = setTimeout(onComplete, timings.exit);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  const handleSkip = useCallback(() => setPhase('exit'), []);

  // Keyboard skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') handleSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSkip]);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // If reduced motion, skip to instant reveal
  useEffect(() => {
    if (prefersReducedMotion) {
      setTimeout(onComplete, 500);
    }
  }, [prefersReducedMotion, onComplete]);

  if (prefersReducedMotion) {
    return (
      <div className="fixed inset-0 z-[100] bg-[hsl(30,10%,4%)] flex items-center justify-center">
        <h1 className="text-4xl font-bold text-[hsl(40,20%,96%)]">DinGaming</h1>
      </div>
    );
  }

  const depthSpeed = [0.6, 1, 1.4]; // Parallax multipliers

  return (
    <AnimatePresence mode="wait">
      {phase !== 'exit' ? (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden cursor-pointer"
          style={{ background: 'hsl(30, 10%, 4%)' }}
          onClick={handleSkip}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Letterbox bars */}
          <motion.div
            className="absolute top-0 left-0 right-0 bg-black z-20"
            initial={{ height: 0 }}
            animate={{ height: '12%' }}
            transition={{ 
              duration: 0.4, 
              ease: [0.25, 0.1, 0.25, 1],
              delay: phase === 'spark' ? 0.1 : 0
            }}
          />
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-black z-20"
            initial={{ height: 0 }}
            animate={{ height: '12%' }}
            transition={{ 
              duration: 0.4, 
              ease: [0.25, 0.1, 0.25, 1],
              delay: phase === 'spark' ? 0.1 : 0
            }}
          />

          {/* Ambient glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              background: phase === 'formation' 
                ? 'radial-gradient(ellipse 60% 50% at 50% 50%, hsla(38, 92%, 50%, 0.15) 0%, transparent 70%)'
                : phase === 'transform'
                  ? 'radial-gradient(ellipse 80% 60% at 50% 45%, hsla(38, 92%, 50%, 0.2) 0%, transparent 60%)'
                  : 'radial-gradient(ellipse 40% 40% at 50% 50%, hsla(38, 92%, 50%, 0.05) 0%, transparent 50%)',
            }}
            transition={{ duration: 0.6 }}
          />

          {/* Skip hint */}
          <motion.div
            className="absolute bottom-[14%] left-1/2 -translate-x-1/2 z-30 text-[10px] tracking-[0.3em] uppercase text-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Tryk for at springe over
          </motion.div>

          {/* Main content area */}
          <div className="absolute inset-0 flex items-center justify-center">
            
            {/* Central spark */}
            <AnimatePresence>
              {phase === 'spark' && (
                <motion.div
                  className="absolute"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1.5, 1],
                    opacity: [0, 1, 1],
                  }}
                  exit={{ scale: 2, opacity: 0 }}
                  transition={{ 
                    duration: 0.5,
                    times: [0, 0.6, 1],
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                >
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{
                      background: 'hsl(38, 92%, 50%)',
                      boxShadow: `
                        0 0 20px hsla(38, 92%, 50%, 0.8),
                        0 0 40px hsla(38, 92%, 50%, 0.6),
                        0 0 60px hsla(38, 92%, 50%, 0.4),
                        0 0 80px hsla(38, 92%, 50%, 0.2)
                      `,
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Particle system */}
            <div className="absolute inset-0 flex items-center justify-center">
              {particles.map((particle) => {
                const speed = depthSpeed[particle.depth];
                
                return (
                  <motion.div
                    key={particle.id}
                    className="absolute rounded-full"
                    style={{
                      width: particle.size,
                      height: particle.size,
                      background: `linear-gradient(135deg, hsl(38, 92%, 55%) 0%, hsl(30, 85%, 45%) 100%)`,
                      boxShadow: `0 0 ${particle.size * 2}px hsla(38, 92%, 50%, ${particle.opacity * 0.6})`,
                      willChange: 'transform, opacity',
                    }}
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      opacity: 0,
                      scale: 0,
                    }}
                    animate={
                      phase === 'spark' 
                        ? { 
                            x: particle.x * 0.3 * speed, 
                            y: particle.y * 0.3 * speed,
                            opacity: particle.opacity * 0.5,
                            scale: 0.5,
                          }
                        : phase === 'formation'
                          ? {
                              x: particle.targetX * (isMobile ? 1.8 : 2.2),
                              y: particle.targetY * (isMobile ? 1.8 : 2.2),
                              opacity: particle.opacity,
                              scale: 1,
                            }
                          : {
                              x: particle.x * 2 * speed,
                              y: particle.y * 2 * speed,
                              opacity: 0,
                              scale: 0.3,
                            }
                    }
                    transition={{
                      type: 'spring',
                      stiffness: phase === 'formation' ? 120 : 80,
                      damping: phase === 'formation' ? 15 : 20,
                      mass: 0.8,
                      delay: particle.delay * (phase === 'spark' ? 1 : 0.5),
                    }}
                  />
                );
              })}
            </div>

            {/* Logo reveal */}
            <AnimatePresence>
              {phase === 'transform' && (
                <motion.div
                  className="absolute flex flex-col items-center z-10"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.5,
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                >
                  {/* Brand name with staggered letters */}
                  <div className="flex overflow-hidden">
                    {'DinGaming'.split('').map((letter, i) => (
                      <motion.span
                        key={i}
                        className="text-4xl md:text-6xl font-bold"
                        style={{ 
                          color: 'hsl(40, 20%, 96%)',
                          textShadow: '0 0 30px hsla(38, 92%, 50%, 0.5)',
                        }}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 20,
                          delay: i * 0.05,
                        }}
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </div>

                  {/* Tagline */}
                  <motion.p
                    className="mt-3 text-sm md:text-base tracking-[0.2em] uppercase"
                    style={{ color: 'hsla(38, 92%, 50%, 0.9)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    Instant Game Keys
                  </motion.p>

                  {/* Golden underline sweep */}
                  <motion.div
                    className="mt-4 h-[2px] rounded-full"
                    style={{ 
                      background: 'linear-gradient(90deg, transparent, hsl(38, 92%, 50%), transparent)',
                    }}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: isMobile ? 180 : 250, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating ambient particles (always visible, subtle) */}
            {!isMobile && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`ambient-${i}`}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      background: 'hsla(38, 92%, 50%, 0.3)',
                      left: `${15 + i * 10}%`,
                      top: `${20 + (i % 3) * 25}%`,
                    }}
                    animate={{
                      y: [0, -30, 0],
                      opacity: [0.2, 0.5, 0.2],
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 4 + i * 0.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default IntroAnimation;
