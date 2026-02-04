import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type Phase = 'cursor' | 'expand' | 'wireframe' | 'fly' | 'collapse' | 'reveal';

const COLORS = {
  background: '#000000',
  gold: '#F5A623',
  goldLight: '#FFD700',
  cyan: '#00E5FF',
  magenta: '#FF00FF',
  lime: '#39FF14',
  purple: '#8B5CF6',
  orange: '#FF6B35',
};

// Genre color themes (abstract - just colors/energy, no literal game UI)
const GENRE_THEMES = [
  { primary: '#39FF14', secondary: '#00FF00', name: 'action' },      // Green energy - action/fps vibe
  { primary: '#00E5FF', secondary: '#FF00FF', name: 'speed' },       // Cyan/magenta - racing/speed vibe  
  { primary: '#8B5CF6', secondary: '#FFD700', name: 'fantasy' },     // Purple/gold - rpg/fantasy vibe
  { primary: '#FF6B35', secondary: '#FF0000', name: 'intensity' },   // Orange/red - strategy/intensity vibe
];

const TIMING = {
  cursor: { start: 0, end: 1000 },
  expand: { start: 1000, end: 1800 },
  wireframe: { start: 1800, end: 3000 },
  fly: { start: 3000, end: 4200 },
  collapse: { start: 4200, end: 5200 },
  reveal: { start: 5200, end: 6200 },
};

const MOBILE_TIMING = {
  cursor: { start: 0, end: 700 },
  expand: { start: 700, end: 1200 },
  wireframe: { start: 1200, end: 2200 },
  fly: { start: 2200, end: 3000 },
  collapse: { start: 3000, end: 3800 },
  reveal: { start: 3800, end: 4600 },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('cursor');
  const [showLogo, setShowLogo] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const startTimeRef = useRef<number>(0);
  const animationRef = useRef<number>(0);
  const isMobile = useIsMobile();
  
  const timing = isMobile ? MOBILE_TIMING : TIMING;

  // Check for reduced motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };
    
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Main animation loop
  useEffect(() => {
    if (prefersReducedMotion) {
      setTimeout(onComplete, 300);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    startTimeRef.current = performance.now();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    // Particle storage
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; color: string;
    }> = [];

    // Grid lines for wireframe
    const gridLines: Array<{
      x1: number; y1: number; x2: number; y2: number;
      progress: number; delay: number;
    }> = [];

    // Initialize grid
    const gridSize = isMobile ? 80 : 50;
    for (let x = -width; x < width * 2; x += gridSize) {
      gridLines.push({ x1: x, y1: -height, x2: x, y2: height * 2, progress: 0, delay: Math.random() * 0.3 });
    }
    for (let y = -height; y < height * 2; y += gridSize) {
      gridLines.push({ x1: -width, y1: y, x2: width * 2, y2: y, progress: 0, delay: Math.random() * 0.3 });
    }

    const animate = (time: number) => {
      const elapsed = time - startTimeRef.current;
      const t = elapsed / 1000; // time in seconds
      
      // Clear
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, width, height);

      // Determine phase
      let currentPhase: Phase = 'cursor';
      if (elapsed >= timing.reveal.start) currentPhase = 'reveal';
      else if (elapsed >= timing.collapse.start) currentPhase = 'collapse';
      else if (elapsed >= timing.fly.start) currentPhase = 'fly';
      else if (elapsed >= timing.wireframe.start) currentPhase = 'wireframe';
      else if (elapsed >= timing.expand.start) currentPhase = 'expand';
      
      setPhase(currentPhase);

      // ========== PHASE: CURSOR ==========
      if (currentPhase === 'cursor') {
        const cursorVisible = Math.sin(t * 6) > 0;
        if (cursorVisible) {
          ctx.fillStyle = COLORS.gold;
          ctx.shadowColor = COLORS.gold;
          ctx.shadowBlur = 20;
          ctx.fillRect(centerX - 1, centerY - 10, 3, 20);
          ctx.shadowBlur = 0;
        }
        
        // Subtle scanlines
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        for (let y = 0; y < height; y += 4) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // ========== PHASE: EXPAND (pixel → wireframe burst) ==========
      if (currentPhase === 'expand') {
        const p = (elapsed - timing.expand.start) / (timing.expand.end - timing.expand.start);
        const eased = 1 - Math.pow(1 - p, 3);
        
        // Central light expanding
        const radius = eased * Math.max(width, height) * 0.8;
        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(1, radius));
        grad.addColorStop(0, `rgba(245, 166, 35, ${1 - eased * 0.5})`);
        grad.addColorStop(0.3, `rgba(0, 229, 255, ${0.6 - eased * 0.3})`);
        grad.addColorStop(0.6, `rgba(255, 0, 255, ${0.3 - eased * 0.2})`);
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(1, radius), 0, Math.PI * 2);
        ctx.fill();

        // Expanding ring pulses
        for (let i = 0; i < 3; i++) {
          const ringP = Math.max(0, p - i * 0.15);
          if (ringP > 0) {
            const ringR = ringP * Math.max(width, height) * 0.9;
            ctx.strokeStyle = `rgba(245, 166, 35, ${(1 - ringP) * 0.6})`;
            ctx.lineWidth = 3 - ringP * 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringR, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Spawn initial particles outward
        if (particles.length < 100 && Math.random() > 0.5) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 3 + Math.random() * 5;
          particles.push({
            x: centerX, y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 3,
            opacity: 1,
            color: Math.random() > 0.5 ? COLORS.gold : COLORS.cyan,
          });
        }
      }

      // ========== PHASE: WIREFRAME (world renders) ==========
      if (currentPhase === 'wireframe' || currentPhase === 'fly') {
        const wp = currentPhase === 'wireframe' 
          ? (elapsed - timing.wireframe.start) / (timing.wireframe.end - timing.wireframe.start)
          : 1;

        // Draw perspective grid (vanishing point at center)
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Horizontal lines with perspective
        const horizonY = 0;
        for (let i = 1; i <= 15; i++) {
          const lineProgress = Math.min(1, (wp - i * 0.02) * 2);
          if (lineProgress > 0) {
            const y = i * 30;
            const perspectiveScale = 1 + i * 0.15;
            
            ctx.strokeStyle = `rgba(0, 229, 255, ${lineProgress * 0.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-width * perspectiveScale, y);
            ctx.lineTo(width * perspectiveScale, y);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(-width * perspectiveScale, -y);
            ctx.lineTo(width * perspectiveScale, -y);
            ctx.stroke();
          }
        }

        // Vertical lines converging to horizon
        for (let i = -20; i <= 20; i++) {
          const lineProgress = Math.min(1, (wp - Math.abs(i) * 0.01) * 2);
          if (lineProgress > 0) {
            ctx.strokeStyle = `rgba(255, 0, 255, ${lineProgress * 0.4})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(i * 40, -height);
            ctx.lineTo(i * 8, height);
            ctx.stroke();
          }
        }

        // Floating polygons
        const polyCount = isMobile ? 5 : 10;
        for (let i = 0; i < polyCount; i++) {
          const polyProgress = Math.min(1, (wp - 0.3 - i * 0.05) * 3);
          if (polyProgress > 0) {
            const angle = t * 0.5 + i * 0.7;
            const dist = 100 + i * 50;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle * 0.6) * dist * 0.5;
            const size = 20 + Math.sin(t + i) * 10;
            
            ctx.strokeStyle = `rgba(245, 166, 35, ${polyProgress * 0.7})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            const sides = 3 + (i % 4);
            for (let s = 0; s <= sides; s++) {
              const a = (s / sides) * Math.PI * 2 + t;
              const sx = px + Math.cos(a) * size * polyProgress;
              const sy = py + Math.sin(a) * size * polyProgress;
              if (s === 0) ctx.moveTo(sx, sy);
              else ctx.lineTo(sx, sy);
            }
            ctx.stroke();
          }
        }

        // Data streams (vertical flowing particles)
        if (currentPhase === 'wireframe') {
          for (let i = 0; i < 30; i++) {
            const streamX = (i - 15) * 50;
            const streamY = ((t * 200 + i * 100) % (height * 2)) - height;
            const opacity = wp * 0.5;
            
            ctx.fillStyle = `rgba(0, 229, 255, ${opacity})`;
            ctx.fillRect(streamX - 1, streamY, 2, 20 + Math.random() * 30);
          }
        }

        ctx.restore();

        // UI elements snapping into place
        if (wp > 0.6) {
          const uiProgress = (wp - 0.6) / 0.4;
          const shake = (1 - uiProgress) * 5;
          
          // Health bar shape (top left)
          ctx.strokeStyle = `rgba(0, 229, 255, ${uiProgress})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(40 + Math.random() * shake, 40 + Math.random() * shake, 120, 16);
          
          // Minimap shape (top right)
          ctx.strokeRect(width - 140 + Math.random() * shake, 40 + Math.random() * shake, 100, 100);
          
          // Bottom HUD elements
          ctx.strokeRect(40 + Math.random() * shake, height - 60 + Math.random() * shake, 200, 30);
        }
      }

      // ========== PHASE: FLY (through abstract genre worlds) ==========
      if (currentPhase === 'fly') {
        const fp = (elapsed - timing.fly.start) / (timing.fly.end - timing.fly.start);
        const genreCount = isMobile ? 2 : 4;
        const genreIndex = Math.min(Math.floor(fp * genreCount), genreCount - 1);
        const genreLocalP = (fp * genreCount) % 1;
        const theme = GENRE_THEMES[genreIndex];

        // Forward flying tunnel effect
        const tunnelRings = 30;
        for (let ring = 0; ring < tunnelRings; ring++) {
          const ringP = ((ring / tunnelRings) + t * 3) % 1;
          const radius = ringP * Math.max(width, height);
          const opacity = (1 - ringP) * 0.5;
          
          ctx.strokeStyle = `${theme.primary}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = 2 + (1 - ringP) * 4;
          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.max(5, radius), 0, Math.PI * 2);
          ctx.stroke();
        }

        // Speed lines radiating outward
        const lineCount = 50;
        for (let i = 0; i < lineCount; i++) {
          const angle = (i / lineCount) * Math.PI * 2;
          const lineP = ((i * 0.05 + t * 5) % 1);
          const innerR = lineP * 50;
          const outerR = innerR + 100 + lineP * 200;
          
          ctx.strokeStyle = `${theme.secondary}${Math.floor((1 - lineP) * 150).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
          ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
          ctx.stroke();
        }

        // Energy bursts / motion blur particles flying past
        for (let i = 0; i < 20; i++) {
          const burstP = ((i * 0.1 + t * 4) % 1);
          const burstAngle = i * 0.5 + genreIndex;
          const burstDist = burstP * Math.max(width, height) * 0.7;
          const bx = centerX + Math.cos(burstAngle) * burstDist;
          const by = centerY + Math.sin(burstAngle) * burstDist;
          const bSize = 5 + burstP * 15;
          
          ctx.fillStyle = `${theme.primary}${Math.floor((1 - burstP) * 200).toString(16).padStart(2, '0')}`;
          ctx.beginPath();
          ctx.arc(bx, by, bSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // Pixel particles scattered
        for (let i = 0; i < 40; i++) {
          const px = (Math.sin(i * 7 + t * 3) * 0.5 + 0.5) * width;
          const py = (Math.cos(i * 5 + t * 2) * 0.5 + 0.5) * height;
          
          ctx.fillStyle = `${i % 2 === 0 ? theme.primary : theme.secondary}80`;
          ctx.fillRect(px, py, 3, 3);
        }

        // Flash between genres
        if (genreLocalP > 0.85) {
          const flashIntensity = (genreLocalP - 0.85) / 0.15;
          ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.7})`;
          ctx.fillRect(0, 0, width, height);
        }

        // Motion blur overlay
        ctx.fillStyle = `${theme.primary}10`;
        ctx.fillRect(0, 0, width, height);
      }

      // ========== PHASE: COLLAPSE (data streams down) ==========
      if (currentPhase === 'collapse') {
        const cp = (elapsed - timing.collapse.start) / (timing.collapse.end - timing.collapse.start);
        setDownloadProgress(cp);

        // Everything collapses into vertical data streams
        const streamCount = 60;
        for (let i = 0; i < streamCount; i++) {
          const sx = (i / streamCount) * width;
          const streamLength = 50 + Math.random() * 100;
          const streamY = ((t * 800 + i * 50) % (height + streamLength)) - streamLength;
          
          // Gradient for stream
          const streamGrad = ctx.createLinearGradient(sx, streamY, sx, streamY + streamLength);
          streamGrad.addColorStop(0, 'transparent');
          streamGrad.addColorStop(0.5, `rgba(245, 166, 35, 0.8)`);
          streamGrad.addColorStop(1, 'transparent');
          
          ctx.fillStyle = streamGrad;
          ctx.fillRect(sx - 1, streamY, 3, streamLength);
        }

        // Data converging to center-bottom
        const targetY = height * 0.6;
        const convergeFactor = cp;
        
        // Glowing convergence point
        const glowSize = 50 + cp * 100;
        const glowGrad = ctx.createRadialGradient(centerX, targetY, 0, centerX, targetY, glowSize);
        glowGrad.addColorStop(0, `rgba(245, 166, 35, ${0.8 * cp})`);
        glowGrad.addColorStop(0.5, `rgba(255, 215, 0, ${0.4 * cp})`);
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(centerX, targetY, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Progress bar at bottom
        const barWidth = Math.min(300, width * 0.6);
        const barHeight = 6;
        const barX = centerX - barWidth / 2;
        const barY = height - 100;
        
        ctx.strokeStyle = 'rgba(245, 166, 35, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = COLORS.gold;
        ctx.shadowColor = COLORS.gold;
        ctx.shadowBlur = 10;
        ctx.fillRect(barX, barY, barWidth * cp, barHeight);
        ctx.shadowBlur = 0;
        
        // Percentage text
        ctx.fillStyle = COLORS.gold;
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(cp * 100)}%`, centerX, barY + 25);
      }

      // ========== PHASE: REVEAL ==========
      if (currentPhase === 'reveal') {
        setShowLogo(true);
        
        // Ambient glow behind logo area
        const logoGlow = ctx.createRadialGradient(centerX, centerY - 50, 0, centerX, centerY - 50, 200);
        logoGlow.addColorStop(0, 'rgba(245, 166, 35, 0.3)');
        logoGlow.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)');
        logoGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = logoGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 50, 200, 0, Math.PI * 2);
        ctx.fill();

        // Subtle floating particles
        for (let i = 0; i < 30; i++) {
          const px = centerX + Math.sin(t + i * 0.5) * 150;
          const py = centerY - 50 + Math.cos(t * 0.7 + i * 0.3) * 100;
          
          ctx.fillStyle = `rgba(245, 166, 35, 0.3)`;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Update particles
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.01;
        
        if (p.opacity > 0) {
          ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Remove dead particles
      for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].opacity <= 0) particles.splice(i, 1);
      }

      // Check for auto-complete
      if (elapsed > timing.reveal.end + 1000 && !isExiting) {
        setIsExiting(true);
        setTimeout(onComplete, 600);
      }

      if (!isExiting || elapsed < timing.reveal.end + 2000) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [timing, isMobile, isExiting, onComplete, prefersReducedMotion]);

  // Skip handler
  const handleSkip = useCallback(() => {
    setIsExiting(true);
    setTimeout(onComplete, 300);
  }, [onComplete]);

  // Keyboard skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') handleSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSkip]);

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-[100] overflow-hidden bg-black"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Logo Reveal */}
      <AnimatePresence>
        {showLogo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
          >
            <motion.h1
              initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-7xl font-bold mb-6"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #F5A623 50%, #C68B1E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 40px rgba(245, 166, 35, 0.6))',
              }}
            >
              DinGaming
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-lg md:text-xl tracking-wider text-white/90 mb-8"
            >
              Instant worlds. One click away.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip button */}
      {!showLogo && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          whileHover={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={handleSkip}
          className="absolute bottom-8 right-8 text-sm text-white/50 hover:text-white transition-colors z-30"
        >
          Skip →
        </motion.button>
      )}
    </motion.div>
  );
};

export default IntroAnimation;
