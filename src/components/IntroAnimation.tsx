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

// Genre dimension themes - each is a distinct animated world
const GENRE_DIMENSIONS = [
  { 
    name: 'adventure',
    primary: '#4ADE80',    // Forest green
    secondary: '#22C55E',
    accent: '#FFD700',
    environment: 'jungle'
  },
  { 
    name: 'fps',
    primary: '#EF4444',    // Tactical red
    secondary: '#DC2626',
    accent: '#22D3EE',
    environment: 'urban'
  },
  { 
    name: 'racing',
    primary: '#F97316',    // Speed orange
    secondary: '#FB923C',
    accent: '#06B6D4',
    environment: 'highway'
  },
  { 
    name: 'fighting',
    primary: '#A855F7',    // Electric purple
    secondary: '#C084FC',
    accent: '#FACC15',
    environment: 'arena'
  },
  { 
    name: 'scifi',
    primary: '#06B6D4',    // Cyber cyan
    secondary: '#22D3EE',
    accent: '#F0ABFC',
    environment: 'space'
  },
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

      // ========== PHASE: WIREFRAME/FLY (Flying through genre dimensions) ==========
      if (currentPhase === 'wireframe' || currentPhase === 'fly') {
        const combinedStart = timing.wireframe.start;
        const combinedEnd = timing.fly.end;
        const totalP = (elapsed - combinedStart) / (combinedEnd - combinedStart);
        
        const genreCount = GENRE_DIMENSIONS.length;
        const genreIndex = Math.min(Math.floor(totalP * genreCount), genreCount - 1);
        const genreLocalP = (totalP * genreCount) % 1;
        const dimension = GENRE_DIMENSIONS[genreIndex];
        
        // ===== COMMON: Forward flying tunnel effect =====
        const tunnelDepth = 40;
        for (let ring = 0; ring < tunnelDepth; ring++) {
          const ringP = ((ring / tunnelDepth) + t * 2.5) % 1;
          const z = ringP;
          const scale = 1 / (z + 0.1);
          const radius = scale * 80;
          const opacity = (1 - ringP) * 0.4;
          
          ctx.strokeStyle = `${dimension.primary}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = Math.max(1, (1 - ringP) * 3);
          ctx.beginPath();
          
          // Different tunnel shapes per genre
          if (dimension.environment === 'jungle') {
            // Organic, irregular tunnel
            for (let a = 0; a < 12; a++) {
              const angle = (a / 12) * Math.PI * 2;
              const wobble = Math.sin(angle * 3 + t * 2 + ring * 0.2) * 20 * (1 - ringP);
              const px = centerX + Math.cos(angle) * (radius + wobble);
              const py = centerY + Math.sin(angle) * (radius + wobble) * 0.7;
              if (a === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
          } else if (dimension.environment === 'urban') {
            // Sharp rectangular tunnel
            const size = radius * 0.8;
            ctx.strokeRect(centerX - size, centerY - size * 0.6, size * 2, size * 1.2);
          } else if (dimension.environment === 'highway') {
            // Wide horizontal tunnel (road)
            ctx.moveTo(centerX - radius * 2, centerY + radius * 0.3);
            ctx.lineTo(centerX + radius * 2, centerY + radius * 0.3);
            ctx.moveTo(centerX - radius * 1.5, centerY - radius * 0.2);
            ctx.lineTo(centerX + radius * 1.5, centerY - radius * 0.2);
          } else if (dimension.environment === 'arena') {
            // Hexagonal arena shape
            for (let a = 0; a < 6; a++) {
              const angle = (a / 6) * Math.PI * 2 - Math.PI / 6;
              const px = centerX + Math.cos(angle) * radius;
              const py = centerY + Math.sin(angle) * radius * 0.8;
              if (a === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
          } else {
            // Circular (space)
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          }
          ctx.stroke();
        }

        // ===== GENRE-SPECIFIC ENVIRONMENTAL ELEMENTS =====
        
        // ADVENTURE: Floating vines, leaves, ancient symbols
        if (dimension.environment === 'jungle') {
          // Floating leaf particles
          for (let i = 0; i < 30; i++) {
            const leafP = ((i * 0.08 + t * 1.5) % 1);
            const angle = i * 0.5 + Math.sin(t + i) * 0.3;
            const dist = leafP * Math.max(width, height) * 0.6;
            const lx = centerX + Math.cos(angle) * dist;
            const ly = centerY + Math.sin(angle) * dist + Math.sin(t * 2 + i) * 20;
            const size = 8 + (1 - leafP) * 12;
            
            ctx.fillStyle = `${dimension.primary}${Math.floor((1 - leafP) * 180).toString(16).padStart(2, '0')}`;
            ctx.beginPath();
            ctx.ellipse(lx, ly, size, size * 0.4, angle + t, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Ancient rune symbols floating
          const runes = ['◊', '△', '○', '☆', '◇'];
          ctx.font = `${isMobile ? 20 : 30}px serif`;
          ctx.textAlign = 'center';
          for (let i = 0; i < 8; i++) {
            const runeP = ((i * 0.15 + t * 0.8) % 1);
            const rx = centerX + Math.sin(i * 2 + t) * 200 * (1 - runeP);
            const ry = centerY + Math.cos(i * 1.5 + t) * 150 * (1 - runeP);
            ctx.fillStyle = `${dimension.accent}${Math.floor((1 - runeP) * 150).toString(16).padStart(2, '0')}`;
            ctx.fillText(runes[i % runes.length], rx, ry);
          }
        }
        
        // FPS: Bullet tracers, crosshairs, tactical grid
        if (dimension.environment === 'urban') {
          // Bullet tracers flying past
          for (let i = 0; i < 20; i++) {
            const bulletP = ((i * 0.1 + t * 8) % 1);
            const startX = Math.random() * width;
            const bx = startX + (centerX - startX) * (1 - bulletP);
            const by = height * bulletP;
            
            ctx.strokeStyle = `${dimension.accent}${Math.floor((1 - bulletP) * 200).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + (bx - centerX) * 0.1, by - 30);
            ctx.stroke();
          }
          
          // Tactical crosshair in center
          const crossSize = 40 + Math.sin(t * 5) * 5;
          ctx.strokeStyle = `${dimension.primary}90`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX - crossSize, centerY);
          ctx.lineTo(centerX - 10, centerY);
          ctx.moveTo(centerX + 10, centerY);
          ctx.lineTo(centerX + crossSize, centerY);
          ctx.moveTo(centerX, centerY - crossSize);
          ctx.lineTo(centerX, centerY - 10);
          ctx.moveTo(centerX, centerY + 10);
          ctx.lineTo(centerX, centerY + crossSize);
          ctx.stroke();
          
          // Muzzle flash effect
          if (Math.random() > 0.92) {
            ctx.fillStyle = `${dimension.primary}40`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 100 + Math.random() * 50, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // RACING: Speed lines, road markings, motion blur
        if (dimension.environment === 'highway') {
          // Road rushing toward camera
          ctx.save();
          ctx.translate(centerX, centerY);
          
          // Road surface
          for (let i = 0; i < 30; i++) {
            const roadP = ((i * 0.05 + t * 4) % 1);
            const roadWidth = 300 * (1 - roadP * 0.8);
            const roadY = height * 0.5 * roadP;
            
            ctx.fillStyle = `${dimension.secondary}${Math.floor((1 - roadP) * 100).toString(16).padStart(2, '0')}`;
            ctx.fillRect(-roadWidth / 2, roadY - 2, roadWidth, 4);
          }
          
          // Center dashed lines
          for (let i = 0; i < 20; i++) {
            const dashP = ((i * 0.08 + t * 6) % 1);
            const dashY = height * 0.5 * dashP;
            const dashWidth = 30 * (1 - dashP);
            
            ctx.fillStyle = `${dimension.accent}${Math.floor((1 - dashP) * 255).toString(16).padStart(2, '0')}`;
            ctx.fillRect(-dashWidth / 2, dashY, dashWidth, 8 * (1 - dashP));
          }
          
          ctx.restore();
          
          // Speed indicator
          const speed = Math.floor(200 + genreLocalP * 150);
          ctx.font = `bold ${isMobile ? 24 : 36}px monospace`;
          ctx.fillStyle = `${dimension.primary}CC`;
          ctx.textAlign = 'right';
          ctx.fillText(`${speed} MPH`, width - 40, height - 40);
        }
        
        // FIGHTING: Energy waves, combo counter, impact effects
        if (dimension.environment === 'arena') {
          // Energy waves radiating
          for (let i = 0; i < 8; i++) {
            const waveP = ((i * 0.15 + t * 3) % 1);
            const waveRadius = waveP * Math.max(width, height) * 0.4;
            const waveOpacity = (1 - waveP) * 0.6;
            
            ctx.strokeStyle = `${dimension.secondary}${Math.floor(waveOpacity * 255).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 4 * (1 - waveP);
            ctx.beginPath();
            ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
            ctx.stroke();
          }
          
          // Lightning/energy bolts
          for (let i = 0; i < 5; i++) {
            if (Math.random() > 0.7) {
              const boltAngle = Math.random() * Math.PI * 2;
              const boltDist = 50 + Math.random() * 150;
              
              ctx.strokeStyle = `${dimension.accent}80`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(centerX, centerY);
              
              let bx = centerX, by = centerY;
              for (let s = 0; s < 5; s++) {
                bx += Math.cos(boltAngle) * (boltDist / 5) + (Math.random() - 0.5) * 30;
                by += Math.sin(boltAngle) * (boltDist / 5) + (Math.random() - 0.5) * 30;
                ctx.lineTo(bx, by);
              }
              ctx.stroke();
            }
          }
          
          // Combo counter
          const combo = Math.floor(genreLocalP * 50) + 1;
          ctx.font = `bold ${isMobile ? 40 : 60}px sans-serif`;
          ctx.fillStyle = `${dimension.accent}`;
          ctx.textAlign = 'center';
          ctx.shadowColor = dimension.primary;
          ctx.shadowBlur = 20;
          ctx.fillText(`${combo} HIT!`, centerX, 80);
          ctx.shadowBlur = 0;
        }
        
        // SCI-FI: Stars, planets, warp effect
        if (dimension.environment === 'space') {
          // Stars streaming past (warp speed)
          for (let i = 0; i < 100; i++) {
            const starP = ((i * 0.02 + t * 3) % 1);
            const angle = (i / 100) * Math.PI * 2 + i * 0.1;
            const dist = starP * Math.max(width, height) * 0.7;
            const sx = centerX + Math.cos(angle) * dist;
            const sy = centerY + Math.sin(angle) * dist;
            
            // Star streak
            ctx.strokeStyle = `${i % 3 === 0 ? dimension.accent : '#FFFFFF'}${Math.floor((1 - starP) * 200).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 1 + (1 - starP) * 2;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(
              centerX + Math.cos(angle) * (dist - 30 - starP * 50),
              centerY + Math.sin(angle) * (dist - 30 - starP * 50)
            );
            ctx.stroke();
          }
          
          // Distant planet
          const planetX = centerX + Math.sin(t * 0.5) * 200;
          const planetY = centerY - 150 + Math.cos(t * 0.3) * 30;
          const planetR = 40;
          
          const planetGrad = ctx.createRadialGradient(planetX - 10, planetY - 10, 0, planetX, planetY, planetR);
          planetGrad.addColorStop(0, dimension.accent);
          planetGrad.addColorStop(0.7, dimension.primary);
          planetGrad.addColorStop(1, '#000000');
          
          ctx.fillStyle = planetGrad;
          ctx.beginPath();
          ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
          ctx.fill();
          
          // Ring around planet
          ctx.strokeStyle = `${dimension.secondary}60`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(planetX, planetY, planetR * 1.8, planetR * 0.3, 0.3, 0, Math.PI * 2);
          ctx.stroke();
        }

        // ===== DIMENSION TRANSITION FLASH =====
        if (genreLocalP > 0.9) {
          const flashIntensity = (genreLocalP - 0.9) / 0.1;
          ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.8})`;
          ctx.fillRect(0, 0, width, height);
        }

        // ===== GENRE NAME INDICATOR =====
        const nameOpacity = genreLocalP < 0.2 ? genreLocalP * 5 : (genreLocalP > 0.8 ? (1 - genreLocalP) * 5 : 1);
        ctx.font = `bold ${isMobile ? 18 : 28}px monospace`;
        ctx.fillStyle = `${dimension.primary}${Math.floor(nameOpacity * 200).toString(16).padStart(2, '0')}`;
        ctx.textAlign = 'center';
        ctx.fillText(dimension.name.toUpperCase(), centerX, height - 60);
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
