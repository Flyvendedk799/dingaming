import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface IntroAnimationProps {
  onComplete: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  size: number;
  opacity: number;
  hue: number;
  trail: { x: number; y: number }[];
  phase: 'ember' | 'burst' | 'converge' | 'dissolve';
  delay: number;
  speed: number;
}

// Golden key silhouette points (normalized 0-1)
const KEY_POINTS = [
  // Key head (circular part)
  { x: 0.5, y: 0.28 }, { x: 0.54, y: 0.29 }, { x: 0.57, y: 0.32 },
  { x: 0.58, y: 0.36 }, { x: 0.57, y: 0.40 }, { x: 0.54, y: 0.43 },
  { x: 0.5, y: 0.44 }, { x: 0.46, y: 0.43 }, { x: 0.43, y: 0.40 },
  { x: 0.42, y: 0.36 }, { x: 0.43, y: 0.32 }, { x: 0.46, y: 0.29 },
  // Key shaft
  { x: 0.5, y: 0.46 }, { x: 0.5, y: 0.52 }, { x: 0.5, y: 0.58 },
  { x: 0.5, y: 0.64 }, { x: 0.5, y: 0.70 },
  // Key teeth
  { x: 0.54, y: 0.64 }, { x: 0.56, y: 0.64 },
  { x: 0.54, y: 0.70 }, { x: 0.56, y: 0.70 },
];

const useParticleEngine = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  phase: string,
  isMobile: boolean
) => {
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const PARTICLE_COUNT = isMobile ? 80 : 150;
  const TRAIL_LENGTH = isMobile ? 6 : 12;

  const initParticles = useCallback((canvas: HTMLCanvasElement) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const particles: Particle[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const keyPoint = KEY_POINTS[i % KEY_POINTS.length];
      
      particles.push({
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        tx: keyPoint.x * canvas.width,
        ty: keyPoint.y * canvas.height,
        size: 2 + Math.random() * 4,
        opacity: 0,
        hue: 35 + Math.random() * 15,
        trail: [],
        phase: 'ember',
        delay: Math.random() * 200,
        speed: 0.5 + Math.random() * 0.5,
      });
    }

    particlesRef.current = particles;
  }, [PARTICLE_COUNT]);

  const updateParticles = useCallback((
    canvas: HTMLCanvasElement,
    elapsed: number,
    delta: number
  ) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const particles = particlesRef.current;
    const dt = Math.min(delta, 32) / 16; // Cap delta time, normalize to 60fps

    particles.forEach((p, i) => {
      // Store trail position
      if (p.trail.length >= TRAIL_LENGTH) {
        p.trail.shift();
      }
      p.trail.push({ x: p.x, y: p.y });

      if (phase === 'void') {
        // Ember phase - particles cluster at center with gentle pulse
        const pulseOffset = Math.sin(elapsed * 0.004 + i * 0.5) * 3;
        const angle = (i / particles.length) * Math.PI * 2;
        p.x = cx + Math.cos(angle) * (5 + pulseOffset);
        p.y = cy + Math.sin(angle) * (5 + pulseOffset);
        p.opacity = 0.4 + Math.sin(elapsed * 0.005) * 0.3;
        p.phase = 'ember';
      } else if (phase === 'burst') {
        // Burst outward with force
        if (p.phase !== 'burst') {
          const angle = (i / particles.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
          const speed = 10 + Math.random() * 15;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
          p.phase = 'burst';
        }
        
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.opacity = Math.min(1, p.opacity + dt * 0.08);
      } else if (phase === 'converge') {
        // Spiral toward key formation with bezier-like curves
        p.phase = 'converge';
        const keyPoint = KEY_POINTS[i % KEY_POINTS.length];
        p.tx = keyPoint.x * canvas.width;
        p.ty = keyPoint.y * canvas.height;
        
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Orbital spiral motion
        const angle = Math.atan2(dy, dx);
        const orbitAngle = angle + Math.PI * 0.15;
        const attractForce = Math.min(dist * 0.015, 2) * p.speed;
        
        p.vx += Math.cos(orbitAngle) * attractForce * dt;
        p.vy += Math.sin(orbitAngle) * attractForce * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
        
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        
        // Glow brighter as they approach target
        const targetOpacity = 0.5 + Math.min(1, (1 - dist / (canvas.width * 0.3))) * 0.5;
        p.opacity = p.opacity + (targetOpacity - p.opacity) * 0.1;
      } else if (phase === 'reveal' || phase === 'exit') {
        // Dissolve upward and fade
        p.phase = 'dissolve';
        p.vy -= 0.15 * dt;
        p.vx += (Math.random() - 0.5) * 0.3 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.opacity *= 0.97;
      }
    });
  }, [phase, TRAIL_LENGTH]);

  const render = useCallback((canvas: HTMLCanvasElement, elapsed: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Clear with warm black
    ctx.fillStyle = '#0a0908';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Radial vignette
    const vignette = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvas.width * 0.7);
    vignette.addColorStop(0, 'rgba(10, 9, 8, 0)');
    vignette.addColorStop(0.5, 'rgba(5, 4, 3, 0.3)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Central glow - intensifies during void/burst phases
    if (phase === 'void' || phase === 'burst') {
      const glowIntensity = phase === 'burst' 
        ? Math.max(0.1, 1 - (elapsed - 500) / 600)
        : 0.3 + Math.sin(elapsed * 0.004) * 0.15;
      
      // Inner bright core
      const innerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      innerGlow.addColorStop(0, `hsla(45, 100%, 85%, ${glowIntensity * 0.8})`);
      innerGlow.addColorStop(0.3, `hsla(42, 95%, 65%, ${glowIntensity * 0.5})`);
      innerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = innerGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Outer ambient glow
      const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 250);
      outerGlow.addColorStop(0, `hsla(38, 92%, 50%, ${glowIntensity * 0.4})`);
      outerGlow.addColorStop(0.5, `hsla(35, 90%, 45%, ${glowIntensity * 0.2})`);
      outerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Converge phase - ambient glow around key formation
    if (phase === 'converge') {
      const convergeGlow = ctx.createRadialGradient(cx, cy * 0.95, 0, cx, cy * 0.95, 200);
      convergeGlow.addColorStop(0, 'hsla(38, 92%, 55%, 0.3)');
      convergeGlow.addColorStop(0.5, 'hsla(35, 90%, 45%, 0.15)');
      convergeGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = convergeGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw particles with trails
    ctx.globalCompositeOperation = 'lighter';
    
    particlesRef.current.forEach((p) => {
      if (p.opacity < 0.02) return;

      // Draw trail as gradient line
      if (p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        
        for (let i = 1; i < p.trail.length; i++) {
          const cp = p.trail[i];
          ctx.lineTo(cp.x, cp.y);
        }
        ctx.lineTo(p.x, p.y);
        
        const trailGradient = ctx.createLinearGradient(
          p.trail[0].x, p.trail[0].y, p.x, p.y
        );
        trailGradient.addColorStop(0, `hsla(${p.hue}, 92%, 50%, 0)`);
        trailGradient.addColorStop(0.5, `hsla(${p.hue}, 92%, 55%, ${p.opacity * 0.3})`);
        trailGradient.addColorStop(1, `hsla(${p.hue}, 92%, 60%, ${p.opacity * 0.6})`);
        
        ctx.strokeStyle = trailGradient;
        ctx.lineWidth = p.size * 0.6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      // Outer glow
      const outerGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
      outerGradient.addColorStop(0, `hsla(${p.hue}, 92%, 55%, ${p.opacity * 0.4})`);
      outerGradient.addColorStop(0.5, `hsla(${p.hue}, 90%, 50%, ${p.opacity * 0.2})`);
      outerGradient.addColorStop(1, 'transparent');
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
      ctx.fillStyle = outerGradient;
      ctx.fill();

      // Particle core with glow
      const coreGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.5);
      coreGradient.addColorStop(0, `hsla(45, 100%, 85%, ${p.opacity})`);
      coreGradient.addColorStop(0.4, `hsla(${p.hue}, 100%, 70%, ${p.opacity * 0.8})`);
      coreGradient.addColorStop(1, `hsla(${p.hue}, 92%, 55%, 0)`);
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      // Bright center point
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(50, 100%, 95%, ${p.opacity * 0.9})`;
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over';
  }, [phase]);

  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
      lastTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    updateParticles(canvas, elapsed, delta);
    render(canvas, elapsed);

    animationRef.current = requestAnimationFrame(animate);
  }, [canvasRef, updateParticles, render]);

  const start = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size with device pixel ratio for sharpness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // Scale context for retina
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    initParticles(canvas);
    startTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);
  }, [canvasRef, initParticles, animate]);

  const stop = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  return { start, stop };
};

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<'void' | 'burst' | 'converge' | 'reveal' | 'exit'>('void');
  const [showLogo, setShowLogo] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  
  const { start, stop } = useParticleEngine(canvasRef, phase, isMobile);

  const totalDuration = isMobile ? 3000 : 3500;

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setTimeout(onComplete, 300);
      return;
    }

    start();
    
    // Phase timeline (optimized timing)
    const timeline = [
      { time: 0, action: () => setPhase('void') },
      { time: 500, action: () => { setPhase('burst'); setShowFlash(true); } },
      { time: 650, action: () => setShowFlash(false) },
      { time: 1200, action: () => setPhase('converge') },
      { time: 2200, action: () => { setPhase('reveal'); setShowLogo(true); } },
      { time: totalDuration - 400, action: () => setPhase('exit') },
      { time: totalDuration, action: () => { stop(); onComplete(); } },
    ];

    const timers = timeline.map(({ time, action }) => 
      setTimeout(action, time)
    );

    return () => {
      timers.forEach(clearTimeout);
      stop();
    };
  }, [start, stop, onComplete, totalDuration, prefersReducedMotion]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Skip handler
  const handleSkip = useCallback(() => {
    stop();
    onComplete();
  }, [stop, onComplete]);

  // Keyboard skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') handleSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSkip]);

  if (prefersReducedMotion) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0a0908] flex items-center justify-center">
        <h1 
          className="text-4xl md:text-6xl font-bold"
          style={{ color: 'hsl(40, 20%, 96%)' }}
        >
          DinGaming
        </h1>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden cursor-pointer"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'exit' ? 0 : 1 }}
      transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
      style={{ background: '#0a0908' }}
      onClick={handleSkip}
    >
      {/* Canvas particle layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ willChange: 'transform' }}
      />

      {/* Screen flash on burst */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            style={{ 
              background: 'radial-gradient(circle at 50% 50%, hsla(45, 100%, 92%, 0.9) 0%, hsla(42, 95%, 70%, 0.4) 30%, transparent 70%)' 
            }}
          />
        )}
      </AnimatePresence>

      {/* Letterbox bars */}
      <motion.div
        className="absolute top-0 left-0 right-0 bg-black z-20"
        initial={{ height: 0 }}
        animate={{ 
          height: phase === 'exit' ? 0 : (isMobile ? '8vh' : '12vh')
        }}
        transition={{ 
          duration: phase === 'void' ? 0.4 : 0.5,
          ease: [0.65, 0, 0.35, 1] 
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-black z-20"
        initial={{ height: 0 }}
        animate={{ 
          height: phase === 'exit' ? 0 : (isMobile ? '8vh' : '12vh')
        }}
        transition={{ 
          duration: phase === 'void' ? 0.4 : 0.5,
          ease: [0.65, 0, 0.35, 1] 
        }}
      />

      {/* Logo reveal */}
      <AnimatePresence>
        {showLogo && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-30"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: phase === 'exit' ? 0 : 1,
              scale: phase === 'exit' ? 1.15 : 1,
              filter: phase === 'exit' ? 'blur(6px)' : 'blur(0px)'
            }}
            exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
            transition={{ 
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            {/* Main title with shimmer */}
            <motion.h1
              className="relative text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ 
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
              }}
              style={{
                background: 'linear-gradient(90deg, hsl(38, 92%, 50%) 0%, hsl(45, 100%, 70%) 25%, hsl(42, 95%, 60%) 50%, hsl(45, 100%, 70%) 75%, hsl(38, 92%, 50%) 100%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 2.5s ease-in-out infinite',
                filter: 'drop-shadow(0 0 30px hsla(38, 92%, 50%, 0.5)) drop-shadow(0 0 60px hsla(38, 92%, 50%, 0.3))',
              }}
            >
              DinGaming
            </motion.h1>

            {/* Golden underline sweep */}
            <motion.div
              className="h-[2px] mt-4 rounded-full overflow-hidden"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isMobile ? 180 : 300, opacity: 1 }}
              transition={{ 
                duration: 0.7,
                delay: 0.15,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              <motion.div
                className="h-full w-full"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, hsl(38, 92%, 55%) 20%, hsl(45, 100%, 70%) 50%, hsl(38, 92%, 55%) 80%, transparent 100%)',
                }}
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.3,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
            </motion.div>

            {/* Tagline */}
            <motion.p
              className="mt-5 text-sm md:text-base tracking-[0.35em] uppercase font-medium"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 0.85, y: 0 }}
              transition={{ 
                duration: 0.5,
                delay: 0.35,
                ease: [0.16, 1, 0.3, 1]
              }}
              style={{ color: 'hsl(38, 60%, 60%)' }}
            >
              Premium Game Keys
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip hint */}
      <motion.div
        className="absolute bottom-[15%] left-1/2 -translate-x-1/2 text-[10px] tracking-[0.25em] uppercase z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.8 }}
        style={{ color: 'hsl(38, 40%, 45%)' }}
      >
        Click to skip
      </motion.div>

      {/* Skip button */}
      <motion.button
        className="absolute bottom-8 right-8 text-xs tracking-widest uppercase opacity-40 hover:opacity-80 transition-opacity z-40"
        onClick={(e) => {
          e.stopPropagation();
          handleSkip();
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.5 }}
        style={{ color: 'hsl(38, 40%, 50%)' }}
      >
        Skip
      </motion.button>

      {/* Shimmer keyframe animation */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { background-position: 200% 50%; }
          50% { background-position: -200% 50%; }
        }
      `}</style>
    </motion.div>
  );
};

export default IntroAnimation;
