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
  depth: number;
  angle: number;
  distance: number;
  targetX: number;
  targetY: number;
  trailLength: number;
  hue: number;
}

// Key shape coordinates for formation
const keyShapePoints = [
  { x: 0, y: -35 }, { x: 15, y: -32 }, { x: 22, y: -20 }, { x: 22, y: -5 },
  { x: 15, y: 7 }, { x: 0, y: 10 }, { x: -15, y: 7 }, { x: -22, y: -5 },
  { x: -22, y: -20 }, { x: -15, y: -32 },
  { x: -5, y: 15 }, { x: 5, y: 15 }, { x: 5, y: 45 }, { x: -5, y: 45 },
  { x: 5, y: 30 }, { x: 15, y: 30 }, { x: 15, y: 38 }, { x: 5, y: 38 },
  { x: 5, y: 42 }, { x: 12, y: 42 }, { x: 12, y: 48 }, { x: -5, y: 48 },
];

// Sub-component: Particle with motion trail
const ParticleWithTrail = ({ 
  particle, 
  phase, 
  isMobile,
  depthSpeed,
}: { 
  particle: Particle;
  phase: string;
  isMobile: boolean;
  depthSpeed: number[];
}) => {
  const speed = depthSpeed[particle.depth];
  const trailShadows = isMobile ? 2 : particle.trailLength;
  
  // Generate trail shadows
  const trailShadow = useMemo(() => {
    const shadows = [];
    for (let i = 1; i <= trailShadows; i++) {
      const offset = i * 4;
      const blur = i * 3;
      const opacity = (1 - i / (trailShadows + 1)) * 0.4;
      shadows.push(`${-offset}px ${-offset}px ${blur}px hsla(${particle.hue}, 92%, 50%, ${opacity})`);
    }
    shadows.push(`0 0 ${particle.size * 2}px hsla(${particle.hue}, 92%, 50%, ${particle.opacity * 0.6})`);
    shadows.push(`0 0 ${particle.size * 4}px hsla(${particle.hue}, 92%, 50%, ${particle.opacity * 0.3})`);
    return shadows.join(', ');
  }, [trailShadows, particle.size, particle.opacity, particle.hue]);

  const getAnimationState = () => {
    switch (phase) {
      case 'void':
        return { 
          x: 0, 
          y: 0,
          opacity: 0,
          scale: 0,
        };
      case 'burst':
        return { 
          x: Math.cos(particle.angle) * particle.distance * speed,
          y: Math.sin(particle.angle) * particle.distance * speed,
          opacity: particle.opacity,
          scale: 1,
        };
      case 'convergence':
        return {
          x: particle.targetX * (isMobile ? 1.8 : 2.2),
          y: particle.targetY * (isMobile ? 1.8 : 2.2),
          opacity: particle.opacity * 1.2,
          scale: 1.1,
        };
      case 'revelation':
      case 'transcendence':
        return {
          x: Math.cos(particle.angle + Math.PI) * particle.distance * 2 * speed,
          y: Math.sin(particle.angle + Math.PI) * particle.distance * 2 * speed - 50,
          opacity: 0,
          scale: 0.2,
        };
      default:
        return { x: 0, y: 0, opacity: 0, scale: 0 };
    }
  };

  const getTransition = () => {
    switch (phase) {
      case 'burst':
        return {
          type: 'spring' as const,
          stiffness: 400,
          damping: 25,
          mass: 0.6,
          delay: particle.delay * 0.5,
        };
      case 'convergence':
        return {
          type: 'spring' as const,
          stiffness: 80,
          damping: 15,
          mass: 1,
          delay: particle.delay * 0.3,
        };
      case 'revelation':
      case 'transcendence':
        return {
          type: 'spring' as const,
          stiffness: 150,
          damping: 18,
          mass: 0.8,
          delay: particle.delay * 0.2,
        };
      default:
        return { duration: 0.3 };
    }
  };

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: particle.size,
        height: particle.size,
        background: `radial-gradient(circle at 30% 30%, hsl(${particle.hue}, 100%, 70%) 0%, hsl(${particle.hue}, 92%, 50%) 50%, hsl(${particle.hue - 10}, 85%, 40%) 100%)`,
        boxShadow: trailShadow,
        willChange: 'transform, opacity',
      }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
      animate={getAnimationState()}
      transition={getTransition()}
    />
  );
};

// Sub-component: Light ray
const LightRay = ({ 
  angle, 
  delay, 
  phase 
}: { 
  angle: number; 
  delay: number; 
  phase: string;
}) => {
  const show = phase === 'burst' || phase === 'transcendence';
  
  return (
    <motion.div
      className="absolute origin-center pointer-events-none"
      style={{
        width: 4,
        height: '120%',
        left: '50%',
        top: '50%',
        transform: `rotate(${angle}deg) translateY(-50%)`,
        background: 'linear-gradient(to top, transparent 0%, hsla(45, 100%, 60%, 0.3) 30%, hsla(45, 100%, 80%, 0.6) 50%, hsla(45, 100%, 60%, 0.3) 70%, transparent 100%)',
        filter: 'blur(2px)',
      }}
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ 
        opacity: show ? [0, 0.8, 0] : 0,
        scaleY: show ? [0, 1, 0] : 0,
      }}
      transition={{
        duration: 0.8,
        delay: delay,
        ease: [0.34, 1.56, 0.64, 1],
      }}
    />
  );
};

// Sub-component: Ripple wave
const RippleWave = ({ 
  delay, 
  phase 
}: { 
  delay: number; 
  phase: string;
}) => {
  const show = phase === 'burst';
  
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 20,
        height: 20,
        left: '50%',
        top: '50%',
        marginLeft: -10,
        marginTop: -10,
        border: '2px solid hsla(38, 92%, 50%, 0.6)',
        boxShadow: '0 0 20px hsla(38, 92%, 50%, 0.4), inset 0 0 20px hsla(38, 92%, 50%, 0.2)',
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: show ? [0, 30] : 0,
        opacity: show ? [0.8, 0] : 0,
      }}
      transition={{
        duration: 1,
        delay: delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    />
  );
};

// Sub-component: Dust mote (ambient particle)
const DustMote = ({ 
  index, 
  phase 
}: { 
  index: number; 
  phase: string;
}) => {
  const x = 10 + (index * 17) % 80;
  const y = 15 + (index * 23) % 70;
  const size = 1 + (index % 3);
  const duration = 5 + (index % 4);
  
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        background: 'hsla(38, 92%, 50%, 0.2)',
        boxShadow: '0 0 4px hsla(38, 92%, 50%, 0.3)',
      }}
      animate={{
        y: [0, -40 - (index % 20), 0],
        x: [0, Math.sin(index) * 15, 0],
        opacity: phase === 'void' ? 0 : [0.1, 0.4, 0.1],
        scale: [1, 1.5, 1],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: index * 0.2,
        ease: 'easeInOut',
      }}
    />
  );
};

// Sub-component: Shimmer text
const ShimmerText = ({ 
  children, 
  delay = 0 
}: { 
  children: string; 
  delay?: number;
}) => {
  return (
    <motion.span
      className="relative inline-block"
      initial={{ y: 60, opacity: 0, filter: 'blur(12px)' }}
      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 22,
        delay: delay,
      }}
      style={{
        color: 'hsl(40, 20%, 96%)',
        textShadow: `
          0 0 30px hsla(38, 92%, 50%, 0.6),
          0 0 60px hsla(38, 92%, 50%, 0.4),
          0 0 90px hsla(38, 92%, 50%, 0.2)
        `,
      }}
    >
      {children}
      {/* Shimmer overlay */}
      <motion.span
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, hsla(45, 100%, 80%, 0.4) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['200% 0', '-200% 0'],
        }}
        transition={{
          duration: 2,
          delay: delay + 0.5,
          ease: 'easeInOut',
        }}
      />
    </motion.span>
  );
};

// Main component
const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<'void' | 'burst' | 'convergence' | 'revelation' | 'transcendence'>('void');
  const isMobile = useIsMobile();
  const particleCount = isMobile ? 50 : 80;

  // Generate particles with enhanced properties
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const keyPoint = keyShapePoints[i % keyShapePoints.length];
      const jitter = 10;
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
      return {
        id: i,
        x: 0,
        y: 0,
        size: 3 + Math.random() * 6,
        opacity: 0.5 + Math.random() * 0.5,
        delay: Math.random() * 0.4,
        depth: Math.floor(Math.random() * 3),
        angle: angle,
        distance: 120 + Math.random() * 150,
        targetX: keyPoint.x + (Math.random() - 0.5) * jitter,
        targetY: keyPoint.y + (Math.random() - 0.5) * jitter,
        trailLength: 3 + Math.floor(Math.random() * 3),
        hue: 35 + Math.random() * 15, // Gold to amber range
      };
    });
  }, [particleCount]);

  // Phase progression with enhanced timing
  useEffect(() => {
    const timings = {
      void: 400,
      burst: 600,
      convergence: 800,
      revelation: 800,
      transcendence: 900,
    };

    const phases: Array<typeof phase> = ['void', 'burst', 'convergence', 'revelation', 'transcendence'];
    const currentIndex = phases.indexOf(phase);
    
    if (currentIndex < phases.length - 1) {
      const timer = setTimeout(() => {
        setPhase(phases[currentIndex + 1]);
      }, timings[phase]);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(onComplete, timings.transcendence);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  const handleSkip = useCallback(() => setPhase('transcendence'), []);

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

  const depthSpeed = [0.5, 1, 1.5];
  const showLogo = phase === 'revelation' || phase === 'transcendence';
  const isExiting = phase === 'transcendence';

  return (
    <AnimatePresence mode="wait">
      {phase !== 'transcendence' || !isExiting ? (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden cursor-pointer"
          style={{ background: 'hsl(30, 10%, 4%)' }}
          onClick={handleSkip}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
        >
          {/* Radial vignette */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, hsl(30, 10%, 2%) 100%)',
            }}
          />

          {/* Letterbox bars */}
          <motion.div
            className="absolute top-0 left-0 right-0 bg-black z-30"
            initial={{ height: 0 }}
            animate={{ 
              height: isExiting ? 0 : '12%',
            }}
            transition={{ 
              duration: 0.5,
              ease: [0.65, 0, 0.35, 1],
            }}
          />
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-black z-30"
            initial={{ height: 0 }}
            animate={{ 
              height: isExiting ? 0 : '12%',
            }}
            transition={{ 
              duration: 0.5,
              ease: [0.65, 0, 0.35, 1],
            }}
          />

          {/* Ripple waves */}
          {!isMobile && (
            <>
              <RippleWave delay={0.1} phase={phase} />
              <RippleWave delay={0.25} phase={phase} />
              <RippleWave delay={0.4} phase={phase} />
            </>
          )}

          {/* Light rays */}
          {!isMobile && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <LightRay key={angle} angle={angle} delay={0.1 + i * 0.03} phase={phase} />
              ))}
            </div>
          )}

          {/* Ambient glow - intensifies through phases */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              background: 
                phase === 'void' 
                  ? 'radial-gradient(ellipse 30% 30% at 50% 50%, hsla(38, 92%, 50%, 0.1) 0%, transparent 70%)'
                  : phase === 'burst'
                    ? 'radial-gradient(ellipse 60% 60% at 50% 50%, hsla(38, 92%, 50%, 0.25) 0%, transparent 60%)'
                    : phase === 'convergence'
                      ? 'radial-gradient(ellipse 50% 50% at 50% 50%, hsla(38, 92%, 50%, 0.3) 0%, transparent 70%)'
                      : 'radial-gradient(ellipse 70% 60% at 50% 45%, hsla(38, 92%, 50%, 0.25) 0%, transparent 55%)',
            }}
            transition={{ duration: 0.5 }}
          />

          {/* Lens flare on burst */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
            style={{
              width: 200,
              height: 200,
              background: 'radial-gradient(circle, hsla(45, 100%, 90%, 0.8) 0%, hsla(45, 100%, 70%, 0.4) 20%, transparent 60%)',
              filter: 'blur(4px)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: phase === 'burst' ? [0, 1.5, 0] : 0,
              opacity: phase === 'burst' ? [0, 1, 0] : 0,
            }}
            transition={{
              duration: 0.5,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          />

          {/* Skip hint */}
          <motion.div
            className="absolute bottom-[14%] left-1/2 -translate-x-1/2 z-40 text-[10px] tracking-[0.3em] uppercase text-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'void' ? 0 : 1 }}
            transition={{ delay: 0.5 }}
          >
            Tryk for at springe over
          </motion.div>

          {/* Dust motes (ambient atmosphere) */}
          {!isMobile && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 20 }, (_, i) => (
                <DustMote key={i} index={i} phase={phase} />
              ))}
            </div>
          )}

          {/* Main content area */}
          <div className="absolute inset-0 flex items-center justify-center">
            
            {/* Central ember (void phase) */}
            <AnimatePresence>
              {phase === 'void' && (
                <motion.div
                  className="absolute z-10"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1.3, 1, 1.2, 1],
                    opacity: 1,
                  }}
                  exit={{ scale: 3, opacity: 0 }}
                  transition={{ 
                    duration: 0.4,
                    times: [0, 0.3, 0.5, 0.7, 1],
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                >
                  <motion.div 
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, hsl(45, 100%, 80%) 0%, hsl(38, 92%, 50%) 60%, hsl(30, 85%, 40%) 100%)',
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 20px hsla(38, 92%, 50%, 0.8), 0 0 40px hsla(38, 92%, 50%, 0.5), 0 0 60px hsla(38, 92%, 50%, 0.3)',
                        '0 0 30px hsla(38, 92%, 50%, 1), 0 0 60px hsla(38, 92%, 50%, 0.7), 0 0 90px hsla(38, 92%, 50%, 0.4), 0 0 120px hsla(38, 92%, 50%, 0.2)',
                        '0 0 20px hsla(38, 92%, 50%, 0.8), 0 0 40px hsla(38, 92%, 50%, 0.5), 0 0 60px hsla(38, 92%, 50%, 0.3)',
                      ],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ignition flash */}
            <motion.div
              className="absolute inset-0 bg-white pointer-events-none z-20"
              initial={{ opacity: 0 }}
              animate={{
                opacity: phase === 'burst' ? [0, 0.4, 0] : 0,
              }}
              transition={{
                duration: 0.3,
                ease: 'easeOut',
              }}
            />

            {/* Particle system */}
            <div className="absolute inset-0 flex items-center justify-center">
              {particles.map((particle) => (
                <ParticleWithTrail
                  key={particle.id}
                  particle={particle}
                  phase={phase}
                  isMobile={isMobile ?? false}
                  depthSpeed={depthSpeed}
                />
              ))}
            </div>

            {/* Golden key formation glow (convergence phase) */}
            <motion.div
              className="absolute pointer-events-none z-5"
              style={{
                width: 150,
                height: 200,
              }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: phase === 'convergence' ? 0.6 : 0,
                scale: phase === 'convergence' ? [0.9, 1.1, 1] : 1,
              }}
              transition={{
                duration: 0.8,
                ease: 'easeInOut',
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  background: 'radial-gradient(ellipse 100% 100% at 50% 40%, hsla(38, 92%, 50%, 0.3) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />
            </motion.div>

            {/* Logo reveal */}
            <AnimatePresence>
              {showLogo && (
                <motion.div
                  className="absolute flex flex-col items-center z-10"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: isExiting ? 0 : 1,
                    scale: isExiting ? 1.2 : 1,
                    filter: isExiting ? 'blur(10px)' : 'blur(0px)',
                  }}
                  transition={{ 
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {/* Brand name with staggered shimmer letters */}
                  <div className="flex overflow-hidden">
                    {'DinGaming'.split('').map((letter, i) => (
                      <ShimmerText key={i} delay={i * 0.04}>
                        {letter}
                      </ShimmerText>
                    ))}
                  </div>

                  {/* Tagline */}
                  <motion.p
                    className="mt-4 text-sm md:text-base tracking-[0.25em] uppercase font-light"
                    style={{ color: 'hsla(38, 92%, 60%, 0.95)' }}
                    initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.45, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    Instant Game Keys
                  </motion.p>

                  {/* Golden underline with shimmer sweep */}
                  <motion.div
                    className="mt-5 h-[2px] rounded-full overflow-hidden"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: isMobile ? 200 : 280, opacity: 1 }}
                    transition={{ delay: 0.55, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <motion.div
                      className="h-full w-full"
                      style={{
                        background: 'linear-gradient(90deg, transparent, hsl(38, 92%, 50%) 30%, hsl(45, 100%, 70%) 50%, hsl(38, 92%, 50%) 70%, transparent)',
                        backgroundSize: '200% 100%',
                      }}
                      animate={{
                        backgroundPosition: ['100% 0', '-100% 0'],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: 0.6,
                        ease: 'easeInOut',
                      }}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Final exit flash */}
          <motion.div
            className="absolute inset-0 bg-white pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{
              opacity: isExiting ? [0, 0.3, 0] : 0,
            }}
            transition={{
              duration: 0.5,
              delay: 0.3,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default IntroAnimation;
