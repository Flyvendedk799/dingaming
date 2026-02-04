import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
  type: 'grid' | 'data' | 'burst' | 'collapse';
  trail: { x: number; y: number }[];
  life: number;
  maxLife: number;
  targetX?: number;
  targetY?: number;
}

interface GridLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  hue: number;
}

interface Polygon {
  vertices: { x: number; y: number }[];
  progress: number;
  hue: number;
  rotation: number;
  scale: number;
  cx: number;
  cy: number;
}

interface UIElement {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'healthbar' | 'menu' | 'icon' | 'minimap';
  opacity: number;
  snapProgress: number;
}

type Phase = 'void' | 'spark' | 'world' | 'chaos' | 'collapse' | 'reveal';
type Genre = 'fps' | 'racing' | 'rpg' | 'strategy';

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  void: '#000000',
  background: '#0a0a1a',
  cyan: '#00E5FF',
  magenta: '#FF00FF',
  lime: '#00FF00',
  gold: '#F5A623',
  goldDark: '#C68B1E',
  goldLight: '#FFD700',
  white: '#F5F5F5',
};

const TIMING = {
  void: { start: 0, end: 800 },
  spark: { start: 800, end: 1400 },
  world: { start: 1400, end: 2600 },
  chaos: { start: 2600, end: 3400 },
  collapse: { start: 3400, end: 4500 },
  reveal: { start: 4500, end: 5500 },
};

const MOBILE_TIMING = {
  void: { start: 0, end: 600 },
  spark: { start: 600, end: 1000 },
  world: { start: 1000, end: 1800 },
  chaos: { start: 1800, end: 2200 },
  collapse: { start: 2200, end: 3000 },
  reveal: { start: 3000, end: 4000 },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

const hslToString = (h: number, s: number, l: number, a: number = 1) => 
  `hsla(${h}, ${s}%, ${l}%, ${a})`;

// Helper function to draw hexagons for strategy genre
const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const px = x + Math.cos(angle) * size;
    const py = y + Math.sin(angle) * size;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
};

// ============================================================================
// DIGITAL WORLD ENGINE HOOK
// ============================================================================

const useDigitalWorldEngine = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  phase: Phase,
  isMobile: boolean,
  elapsedTime: number
) => {
  const particlesRef = useRef<Particle[]>([]);
  const gridLinesRef = useRef<GridLine[]>([]);
  const polygonsRef = useRef<Polygon[]>([]);
  const uiElementsRef = useRef<UIElement[]>([]);
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const initializedPhasesRef = useRef<Set<Phase>>(new Set());

  const config = {
    gridParticles: isMobile ? 150 : 300,
    dataParticles: isMobile ? 80 : 150,
    collapseParticles: isMobile ? 200 : 400,
    trailLength: isMobile ? 6 : 10,
  };

  // Initialize particles based on phase
  const initializePhase = useCallback((newPhase: Phase, width: number, height: number) => {
    if (initializedPhasesRef.current.has(newPhase)) return;
    initializedPhasesRef.current.add(newPhase);
    
    const centerX = width / 2;
    const centerY = height / 2;

    switch (newPhase) {
      case 'spark':
        // Create initial burst particles
        particlesRef.current = Array.from({ length: config.gridParticles }, () => ({
          x: centerX,
          y: centerY,
          vx: randomRange(-8, 8),
          vy: randomRange(-8, 8),
          size: randomRange(2, 6),
          opacity: 1,
          hue: randomRange(170, 200), // Cyan range
          type: 'burst' as const,
          trail: [],
          life: 1,
          maxLife: 1,
        }));
        break;

      case 'world':
        // Create grid lines
        const gridSpacing = isMobile ? 60 : 40;
        gridLinesRef.current = [];
        
        // Horizontal lines with perspective
        for (let y = -10; y <= 10; y++) {
          const yPos = centerY + y * gridSpacing * (1 + Math.abs(y) * 0.1);
          gridLinesRef.current.push({
            x1: 0, y1: yPos,
            x2: width, y2: yPos,
            progress: 0,
            hue: randomRange(170, 200),
          });
        }
        
        // Vertical lines converging to center
        for (let x = -15; x <= 15; x++) {
          const xPos = centerX + x * gridSpacing;
          gridLinesRef.current.push({
            x1: xPos, y1: 0,
            x2: centerX + x * gridSpacing * 0.3, y2: height,
            progress: 0,
            hue: randomRange(280, 320), // Magenta range
          });
        }

        // Create polygons
        polygonsRef.current = Array.from({ length: isMobile ? 8 : 15 }, () => {
          const sides = Math.floor(randomRange(3, 7));
          const radius = randomRange(30, 80);
          const cx = randomRange(width * 0.1, width * 0.9);
          const cy = randomRange(height * 0.1, height * 0.9);
          
          return {
            vertices: Array.from({ length: sides }, (_, i) => ({
              x: cx + Math.cos((i / sides) * Math.PI * 2) * radius,
              y: cy + Math.sin((i / sides) * Math.PI * 2) * radius,
            })),
            progress: 0,
            hue: randomRange(80, 140), // Green range
            rotation: 0,
            scale: 0,
            cx,
            cy,
          };
        });

        // Create UI elements
        uiElementsRef.current = [
          { x: 50, y: 50, width: 150, height: 20, type: 'healthbar', opacity: 0, snapProgress: 0 },
          { x: width - 120, y: 50, width: 100, height: 100, type: 'minimap', opacity: 0, snapProgress: 0 },
          { x: 50, y: height - 80, width: 200, height: 40, type: 'menu', opacity: 0, snapProgress: 0 },
          { x: width - 80, y: height - 80, width: 60, height: 60, type: 'icon', opacity: 0, snapProgress: 0 },
        ];

        // Add data stream particles
        particlesRef.current = [
          ...particlesRef.current.filter(p => p.life > 0),
          ...Array.from({ length: config.dataParticles }, () => ({
            x: randomRange(0, width),
            y: randomRange(0, height),
            vx: randomRange(-1, 1),
            vy: randomRange(1, 3),
            size: randomRange(1, 3),
            opacity: randomRange(0.3, 0.8),
            hue: randomRange(170, 200),
            type: 'data' as const,
            trail: [],
            life: 1,
            maxLife: 1,
          })),
        ];
        break;

      case 'chaos':
        // Keep existing particles but add burst effects
        const burstCount = isMobile ? 30 : 60;
        particlesRef.current = [
          ...particlesRef.current,
          ...Array.from({ length: burstCount }, () => ({
            x: randomRange(0, width),
            y: randomRange(0, height),
            vx: randomRange(-15, 15),
            vy: randomRange(-15, 15),
            size: randomRange(3, 8),
            opacity: 1,
            hue: randomRange(0, 360),
            type: 'burst' as const,
            trail: [],
            life: 1,
            maxLife: 1,
          })),
        ];
        break;

      case 'collapse':
        // Convert all particles to collapse type with downward velocity
        const targetY = height * 0.7;
        particlesRef.current = [
          ...particlesRef.current.map(p => ({
            ...p,
            type: 'collapse' as const,
            vy: randomRange(5, 15),
            targetX: centerX + randomRange(-50, 50),
            targetY: targetY,
          })),
          ...Array.from({ length: config.collapseParticles }, () => ({
            x: randomRange(0, width),
            y: randomRange(-height * 0.3, height * 0.5),
            vx: randomRange(-2, 2),
            vy: randomRange(8, 20),
            size: randomRange(2, 5),
            opacity: 1,
            hue: randomRange(170, 200),
            type: 'collapse' as const,
            trail: [],
            life: 1,
            maxLife: 1,
            targetX: centerX + randomRange(-100, 100),
            targetY: targetY,
          })),
        ];
        break;
    }
  }, [config, isMobile]);

  // Main render loop
  const render = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, delta: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const timing = isMobile ? MOBILE_TIMING : TIMING;

    // Clear with slight trail effect
    ctx.fillStyle = phase === 'void' ? COLORS.void : 'rgba(10, 10, 26, 0.15)';
    ctx.fillRect(0, 0, width, height);

    // Phase-specific rendering
    switch (phase) {
      case 'void': {
        // "LOADING..." text with typing effect
        const loadingText = "INITIALIZING";
        const visibleChars = Math.floor((elapsedTime / (timing.void.end / 1000)) * loadingText.length);
        const displayText = loadingText.substring(0, Math.min(visibleChars, loadingText.length));
        
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.gold;
        ctx.shadowColor = COLORS.gold;
        ctx.shadowBlur = 8;
        ctx.fillText(displayText, centerX, centerY - 40);
        ctx.shadowBlur = 0;

        // Blinking cursor after text
        const cursorBlink = Math.sin(elapsedTime * 8) > 0;
        const textWidth = ctx.measureText(displayText).width;
        if (cursorBlink) {
          ctx.fillStyle = COLORS.gold;
          ctx.shadowColor = COLORS.gold;
          ctx.shadowBlur = 15;
          ctx.fillRect(centerX + textWidth / 2 + 4, centerY - 52, 3, 20);
          ctx.shadowBlur = 0;
        }

        // Animated progress dots
        const dots = Math.floor(elapsedTime * 3) % 4;
        ctx.fillStyle = COLORS.gold;
        ctx.font = 'bold 24px monospace';
        ctx.fillText('.'.repeat(dots), centerX, centerY - 10);

        // Outer ring pulsing
        const pulseScale = 0.8 + Math.sin(elapsedTime * 4) * 0.2;
        ctx.strokeStyle = `rgba(245, 166, 35, ${0.3 + Math.sin(elapsedTime * 4) * 0.2})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 20, 80 * pulseScale, 0, Math.PI * 2);
        ctx.stroke();

        // Scanlines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        for (let y = 0; y < height; y += 3) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Subtle noise with gold tint
        const noiseIntensity = 0.04;
        for (let i = 0; i < 60; i++) {
          ctx.fillStyle = `rgba(245, 166, 35, ${Math.random() * noiseIntensity})`;
          ctx.fillRect(
            Math.random() * width,
            Math.random() * height,
            1, 1
          );
        }
        break;
      }

      case 'spark': {
        const sparkProgress = (elapsedTime - timing.spark.start / 1000) / ((timing.spark.end - timing.spark.start) / 1000);
        
        // Central light burst
        const burstRadius = easeOutQuart(Math.max(0, sparkProgress)) * Math.min(width, height) * 0.8;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(1, burstRadius));
        gradient.addColorStop(0, 'rgba(0, 229, 255, 0.8)');
        gradient.addColorStop(0.3, 'rgba(255, 0, 255, 0.4)');
        gradient.addColorStop(0.7, 'rgba(0, 229, 255, 0.1)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(1, burstRadius), 0, Math.PI * 2);
        ctx.fill();

        // Lens flare rings
        for (let i = 0; i < 3; i++) {
          const ringRadius = burstRadius * (0.4 + i * 0.3);
          if (ringRadius > 0) {
            ctx.strokeStyle = `rgba(0, 229, 255, ${0.5 - i * 0.15})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Update and render burst particles
        particlesRef.current.forEach(p => {
          if (p.type !== 'burst') return;
          
          // Update position
          p.x += p.vx * delta * 60;
          p.y += p.vy * delta * 60;
          p.opacity = Math.max(0, p.opacity - delta * 0.5);
          
          // Update trail
          p.trail.unshift({ x: p.x, y: p.y });
          if (p.trail.length > config.trailLength) p.trail.pop();

          // Render trail
          if (p.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let i = 1; i < p.trail.length; i++) {
              ctx.lineTo(p.trail[i].x, p.trail[i].y);
            }
            ctx.strokeStyle = hslToString(p.hue, 100, 60, p.opacity * 0.5);
            ctx.lineWidth = p.size * 0.5;
            ctx.stroke();
          }

          // Render particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = hslToString(p.hue, 100, 70, p.opacity);
          ctx.shadowColor = hslToString(p.hue, 100, 60, 1);
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
        break;
      }

      case 'world': {
        const worldProgress = (elapsedTime - timing.world.start / 1000) / ((timing.world.end - timing.world.start) / 1000);
        
        // Update and render grid lines
        gridLinesRef.current.forEach((line, i) => {
          const delay = i * 0.02;
          line.progress = Math.min(1, Math.max(0, (worldProgress - delay) * 3));
          
          if (line.progress > 0) {
            const endX = lerp(line.x1, line.x2, easeOutQuart(line.progress));
            const endY = lerp(line.y1, line.y2, easeOutQuart(line.progress));
            
            ctx.beginPath();
            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = hslToString(line.hue, 100, 60, 0.6);
            ctx.lineWidth = 1;
            ctx.shadowColor = hslToString(line.hue, 100, 50, 1);
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        });

        // Update and render polygons
        polygonsRef.current.forEach((poly, i) => {
          const delay = 0.3 + i * 0.05;
          poly.progress = Math.min(1, Math.max(0, (worldProgress - delay) * 2));
          poly.rotation += delta * 0.5;
          poly.scale = easeOutQuart(poly.progress);

          if (poly.progress > 0 && poly.vertices.length > 0) {
            ctx.save();
            ctx.translate(poly.cx, poly.cy);
            ctx.rotate(poly.rotation);
            ctx.scale(poly.scale, poly.scale);
            ctx.translate(-poly.cx, -poly.cy);

            // Draw vertices first
            poly.vertices.forEach((v, vi) => {
              const vertexProgress = Math.min(1, poly.progress * poly.vertices.length - vi);
              if (vertexProgress > 0) {
                ctx.beginPath();
                ctx.arc(v.x, v.y, 4 * vertexProgress, 0, Math.PI * 2);
                ctx.fillStyle = hslToString(poly.hue, 100, 70, vertexProgress);
                ctx.shadowColor = hslToString(poly.hue, 100, 50, 1);
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0;
              }
            });

            // Draw edges
            const edgeProgress = Math.max(0, (poly.progress - 0.3) / 0.7);
            if (edgeProgress > 0) {
              ctx.beginPath();
              const firstV = poly.vertices[0];
              ctx.moveTo(firstV.x, firstV.y);
              
              for (let i = 1; i <= poly.vertices.length; i++) {
                const v = poly.vertices[i % poly.vertices.length];
                const prevV = poly.vertices[i - 1];
                const segmentProgress = Math.min(1, edgeProgress * poly.vertices.length - (i - 1));
                
                if (segmentProgress > 0) {
                  const lx = lerp(prevV.x, v.x, segmentProgress);
                  const ly = lerp(prevV.y, v.y, segmentProgress);
                  ctx.lineTo(lx, ly);
                }
              }
              
              ctx.strokeStyle = hslToString(poly.hue, 100, 60, edgeProgress * 0.8);
              ctx.lineWidth = 2;
              ctx.stroke();
            }

            ctx.restore();
          }
        });

        // Update and render UI elements
        uiElementsRef.current.forEach((ui, i) => {
          const delay = 0.5 + i * 0.1;
          ui.snapProgress = Math.min(1, Math.max(0, (worldProgress - delay) * 4));
          ui.opacity = easeOutQuart(ui.snapProgress);

          if (ui.opacity > 0) {
            const shake = ui.snapProgress < 1 ? (1 - ui.snapProgress) * 5 : 0;
            const shakeX = Math.sin(elapsedTime * 50) * shake;
            const shakeY = Math.cos(elapsedTime * 50) * shake;

            ctx.strokeStyle = `rgba(0, 229, 255, ${ui.opacity})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = COLORS.cyan;
            ctx.shadowBlur = 10;

            switch (ui.type) {
              case 'healthbar':
                ctx.strokeRect(ui.x + shakeX, ui.y + shakeY, ui.width, ui.height);
                ctx.fillStyle = `rgba(0, 255, 0, ${ui.opacity * 0.5})`;
                ctx.fillRect(ui.x + 2 + shakeX, ui.y + 2 + shakeY, (ui.width - 4) * 0.7, ui.height - 4);
                break;
              case 'minimap':
                ctx.strokeRect(ui.x + shakeX, ui.y + shakeY, ui.width, ui.height);
                // Grid inside minimap
                for (let g = 0; g < 4; g++) {
                  ctx.strokeStyle = `rgba(0, 229, 255, ${ui.opacity * 0.3})`;
                  ctx.beginPath();
                  ctx.moveTo(ui.x + shakeX, ui.y + g * 25 + shakeY);
                  ctx.lineTo(ui.x + ui.width + shakeX, ui.y + g * 25 + shakeY);
                  ctx.stroke();
                }
                break;
              case 'menu':
                ctx.strokeRect(ui.x + shakeX, ui.y + shakeY, ui.width, ui.height);
                // Menu items
                for (let m = 0; m < 3; m++) {
                  ctx.fillStyle = `rgba(0, 229, 255, ${ui.opacity * 0.4})`;
                  ctx.fillRect(ui.x + 10 + m * 60 + shakeX, ui.y + 10 + shakeY, 40, 20);
                }
                break;
              case 'icon':
                ctx.beginPath();
                ctx.arc(ui.x + ui.width / 2 + shakeX, ui.y + ui.height / 2 + shakeY, ui.width / 2, 0, Math.PI * 2);
                ctx.stroke();
                break;
            }
            ctx.shadowBlur = 0;
          }
        });

        // Render data particles
        particlesRef.current.forEach(p => {
          if (p.type !== 'data') return;
          
          p.x += p.vx * delta * 60;
          p.y += p.vy * delta * 60;
          
          // Wrap around
          if (p.y > height) p.y = -10;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = hslToString(p.hue, 100, 70, p.opacity);
          ctx.fill();
        });
        break;
      }

      case 'chaos': {
        const chaosProgress = (elapsedTime - timing.chaos.start / 1000) / ((timing.chaos.end - timing.chaos.start) / 1000);
        const genres: Genre[] = isMobile ? ['fps', 'racing'] : ['fps', 'racing', 'rpg', 'strategy'];
        const genreDuration = 1 / genres.length;
        const genreIndex = Math.floor(chaosProgress * genres.length);
        const currentGenre = genres[Math.min(genreIndex, genres.length - 1)];
        const genreLocalProgress = (chaosProgress % genreDuration) / genreDuration;
        
        // Forward flying tunnel effect - always present
        const tunnelDepth = 40;
        const maxRadius = Math.max(width, height) * 1.2;
        
        // Draw tunnel rings zooming toward camera
        for (let ring = 0; ring < tunnelDepth; ring++) {
          const ringProgress = ((ring / tunnelDepth) + elapsedTime * 2) % 1;
          const ringRadius = ringProgress * maxRadius;
          const ringOpacity = (1 - ringProgress) * 0.4;
          
          if (ringOpacity > 0.02) {
            ctx.strokeStyle = `rgba(245, 166, 35, ${ringOpacity})`;
            ctx.lineWidth = 1 + (1 - ringProgress) * 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, Math.max(5, ringRadius), 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Speed lines from center outward (flying forward effect)
        const speedLineCount = 60;
        for (let i = 0; i < speedLineCount; i++) {
          const angle = (i / speedLineCount) * Math.PI * 2;
          const lineProgress = ((i * 0.1 + elapsedTime * 4) % 1);
          const innerR = lineProgress * maxRadius * 0.3;
          const outerR = innerR + 80 + lineProgress * 150;
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - lineProgress) * 0.3})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
          ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
          ctx.stroke();
        }

        // World portal frame (the "window" into each genre)
        const portalScale = 0.5 + genreLocalProgress * 0.5;
        const portalSize = Math.min(width, height) * 0.7 * portalScale;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Genre-specific world environments
        switch (currentGenre) {
          case 'fps': {
            // FPS World: Dark industrial corridor with green tactical elements
            const fpsGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, portalSize);
            fpsGradient.addColorStop(0, 'rgba(20, 40, 20, 0.9)');
            fpsGradient.addColorStop(0.7, 'rgba(10, 30, 10, 0.8)');
            fpsGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = fpsGradient;
            ctx.beginPath();
            ctx.arc(0, 0, portalSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Tactical grid floor receding into distance
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.lineWidth = 1;
            for (let z = 0; z < 15; z++) {
              const zOffset = ((z * 0.1 + elapsedTime * 2) % 1);
              const perspectiveY = (zOffset - 0.5) * portalSize * 1.5;
              const perspectiveScale = 1 - zOffset * 0.8;
              
              ctx.globalAlpha = (1 - zOffset) * 0.5;
              ctx.beginPath();
              ctx.moveTo(-portalSize * perspectiveScale, perspectiveY);
              ctx.lineTo(portalSize * perspectiveScale, perspectiveY);
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
            
            // Crosshair in center
            ctx.strokeStyle = COLORS.lime;
            ctx.lineWidth = 3;
            ctx.shadowColor = COLORS.lime;
            ctx.shadowBlur = 20;
            const crossSize = 50 * portalScale;
            ctx.beginPath();
            ctx.moveTo(-crossSize, 0); ctx.lineTo(-15, 0);
            ctx.moveTo(15, 0); ctx.lineTo(crossSize, 0);
            ctx.moveTo(0, -crossSize); ctx.lineTo(0, -15);
            ctx.moveTo(0, 15); ctx.lineTo(0, crossSize);
            ctx.stroke();
            
            // Muzzle flashes
            if (Math.random() > 0.7) {
              ctx.fillStyle = 'rgba(255, 200, 50, 0.8)';
              ctx.beginPath();
              ctx.arc(randomRange(-100, 100), randomRange(-50, 50), randomRange(10, 30), 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.shadowBlur = 0;
            break;
          }

          case 'racing': {
            // Racing World: Neon highway with motion blur
            const racingGradient = ctx.createLinearGradient(0, -portalSize, 0, portalSize);
            racingGradient.addColorStop(0, 'rgba(10, 10, 40, 0.9)');
            racingGradient.addColorStop(0.4, 'rgba(20, 10, 50, 0.8)');
            racingGradient.addColorStop(1, 'rgba(40, 20, 60, 0.7)');
            ctx.fillStyle = racingGradient;
            ctx.beginPath();
            ctx.arc(0, 0, portalSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Neon road lines rushing toward camera
            for (let lane = -2; lane <= 2; lane++) {
              for (let seg = 0; seg < 20; seg++) {
                const segProgress = ((seg * 0.1 + elapsedTime * 5) % 1);
                const perspectiveScale = segProgress;
                const y = (segProgress - 0.5) * portalSize * 2;
                const x = lane * 60 * perspectiveScale;
                const lineWidth = 5 + segProgress * 20;
                const lineHeight = 40 * perspectiveScale;
                
                ctx.fillStyle = lane === 0 
                  ? `rgba(255, 0, 255, ${(1 - segProgress) * 0.8})` 
                  : `rgba(0, 229, 255, ${(1 - segProgress) * 0.5})`;
                ctx.shadowColor = lane === 0 ? COLORS.magenta : COLORS.cyan;
                ctx.shadowBlur = 15;
                ctx.fillRect(x - lineWidth/2, y - lineHeight/2, lineWidth, lineHeight);
              }
            }
            
            // Speed indicator
            ctx.shadowBlur = 0;
            ctx.fillStyle = COLORS.magenta;
            ctx.font = `bold ${40 * portalScale}px monospace`;
            ctx.textAlign = 'center';
            ctx.shadowColor = COLORS.magenta;
            ctx.shadowBlur = 20;
            ctx.fillText(`${Math.floor(200 + genreLocalProgress * 120)} KM/H`, 0, portalSize * 0.6);
            ctx.shadowBlur = 0;
            break;
          }

          case 'rpg': {
            // RPG World: Mystical fantasy with magical particles
            const rpgGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, portalSize);
            rpgGradient.addColorStop(0, 'rgba(60, 20, 80, 0.9)');
            rpgGradient.addColorStop(0.5, 'rgba(40, 15, 60, 0.8)');
            rpgGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = rpgGradient;
            ctx.beginPath();
            ctx.arc(0, 0, portalSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Floating magical runes in a circle
            const runeCount = 8;
            for (let r = 0; r < runeCount; r++) {
              const runeAngle = (r / runeCount) * Math.PI * 2 + elapsedTime;
              const runeRadius = portalSize * 0.5;
              const rx = Math.cos(runeAngle) * runeRadius;
              const ry = Math.sin(runeAngle) * runeRadius * 0.4;
              
              ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(elapsedTime * 3 + r) * 0.3})`;
              ctx.shadowColor = COLORS.goldLight;
              ctx.shadowBlur = 15;
              ctx.font = `${20 + Math.sin(elapsedTime * 2 + r) * 5}px serif`;
              ctx.fillText(['✦', '◇', '✧', '⬡', '◆', '✶', '⬢', '✴'][r], rx, ry);
            }
            
            // Central magic orb
            const orbPulse = 0.8 + Math.sin(elapsedTime * 4) * 0.2;
            const orbGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 60 * orbPulse);
            orbGradient.addColorStop(0, 'rgba(150, 100, 255, 0.9)');
            orbGradient.addColorStop(0.5, 'rgba(100, 50, 200, 0.6)');
            orbGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = orbGradient;
            ctx.beginPath();
            ctx.arc(0, 0, 60 * orbPulse, 0, Math.PI * 2);
            ctx.fill();
            
            // Sparkle particles floating up
            for (let sp = 0; sp < 25; sp++) {
              const spProgress = ((sp * 0.08 + elapsedTime * 1.5) % 1);
              const spX = Math.sin(sp * 2.5 + elapsedTime) * portalSize * 0.6;
              const spY = portalSize * 0.5 - spProgress * portalSize;
              
              ctx.fillStyle = `rgba(255, 220, 150, ${(1 - spProgress) * 0.7})`;
              ctx.beginPath();
              ctx.arc(spX, spY, 3 + (1 - spProgress) * 4, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.shadowBlur = 0;
            break;
          }

          case 'strategy': {
            // Strategy World: Top-down battlefield with unit movements
            const stratGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, portalSize);
            stratGradient.addColorStop(0, 'rgba(20, 35, 20, 0.9)');
            stratGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = stratGradient;
            ctx.beginPath();
            ctx.arc(0, 0, portalSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Hex grid rotating toward camera
            const hexSize = 40;
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
            ctx.lineWidth = 1;
            for (let hx = -5; hx <= 5; hx++) {
              for (let hy = -4; hy <= 4; hy++) {
                const offsetX = (hy % 2) * hexSize * 0.87;
                const x = hx * hexSize * 1.74 + offsetX;
                const y = hy * hexSize * 1.5;
                const dist = Math.sqrt(x*x + y*y);
                
                if (dist < portalSize * 0.8) {
                  ctx.globalAlpha = 0.3 + Math.sin(elapsedTime * 2 + hx + hy) * 0.2;
                  drawHexagon(ctx, x, y, hexSize * 0.9);
                }
              }
            }
            ctx.globalAlpha = 1;
            
            // Moving unit indicators
            const unitPositions = [
              { x: -80, y: -40, color: COLORS.lime, moving: true },
              { x: 60, y: 20, color: '#FF4444', moving: true },
              { x: -30, y: 60, color: COLORS.lime, moving: false },
              { x: 100, y: -60, color: '#FF4444', moving: false },
            ];
            
            unitPositions.forEach((unit, i) => {
              const moveOffset = unit.moving ? Math.sin(elapsedTime * 3 + i) * 10 : 0;
              ctx.fillStyle = unit.color;
              ctx.shadowColor = unit.color;
              ctx.shadowBlur = 10;
              ctx.beginPath();
              ctx.arc(unit.x + moveOffset, unit.y, 12, 0, Math.PI * 2);
              ctx.fill();
              
              // Movement path
              if (unit.moving) {
                ctx.strokeStyle = `${unit.color}80`;
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(unit.x + moveOffset, unit.y);
                ctx.lineTo(unit.x + moveOffset + 50, unit.y + 30);
                ctx.stroke();
                ctx.setLineDash([]);
              }
            });
            
            // Command cursor
            ctx.strokeStyle = COLORS.gold;
            ctx.lineWidth = 2;
            ctx.shadowColor = COLORS.gold;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, 25 + Math.sin(elapsedTime * 5) * 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            break;
          }
        }
        
        ctx.restore();

        // Portal edge glow (frame around the world)
        const portalGlow = ctx.createRadialGradient(centerX, centerY, portalSize * 0.9, centerX, centerY, portalSize * 1.1);
        portalGlow.addColorStop(0, 'transparent');
        portalGlow.addColorStop(0.5, 'rgba(245, 166, 35, 0.5)');
        portalGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = portalGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, portalSize * 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Transition flash between genres
        const transitionPoint = genreLocalProgress > 0.9;
        if (transitionPoint) {
          const flashIntensity = (genreLocalProgress - 0.9) * 10;
          ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.6})`;
          ctx.fillRect(0, 0, width, height);
        }

        // Burst particles flying past camera
        particlesRef.current.forEach(p => {
          if (p.type !== 'burst') return;
          
          // Make particles fly outward from center (toward camera effect)
          const dx = p.x - centerX;
          const dy = p.y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          p.vx = (dx / dist) * 8;
          p.vy = (dy / dist) * 8;
          p.x += p.vx * delta * 60;
          p.y += p.vy * delta * 60;
          p.opacity = Math.max(0, p.opacity - delta * 1.5);
          p.size += delta * 5; // Grow as they approach camera

          if (p.opacity > 0) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = hslToString(p.hue, 100, 60, p.opacity);
            ctx.fill();
          }
        });
        break;
      }

      case 'collapse': {
        const collapseProgress = (elapsedTime - timing.collapse.start / 1000) / ((timing.collapse.end - timing.collapse.start) / 1000);
        const targetY = height * 0.6;

        // Update and render collapse particles
        particlesRef.current.forEach(p => {
          if (p.type !== 'collapse') return;

          // Attract to center bottom
          const dx = (p.targetX ?? centerX) - p.x;
          const dy = targetY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 10) {
            p.vx += (dx / dist) * 0.5;
            p.vy += (dy / dist) * 0.5;
          }
          
          p.vx *= 0.95;
          p.vy *= 0.95;
          p.x += p.vx * delta * 60;
          p.y += p.vy * delta * 60;

          // Update trail
          p.trail.unshift({ x: p.x, y: p.y });
          if (p.trail.length > config.trailLength) p.trail.pop();

          // Render trail
          if (p.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let i = 1; i < p.trail.length; i++) {
              ctx.lineTo(p.trail[i].x, p.trail[i].y);
            }
            ctx.strokeStyle = hslToString(p.hue, 100, 60, 0.4);
            ctx.lineWidth = p.size * 0.4;
            ctx.stroke();
          }

          // Render particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - collapseProgress * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = hslToString(p.hue, 100, 70, Math.max(0.3, 1 - collapseProgress));
          ctx.fill();
        });

        // Central glow growing
        const glowRadius = 50 + collapseProgress * 150;
        const glowGradient = ctx.createRadialGradient(centerX, targetY, 0, centerX, targetY, glowRadius);
        glowGradient.addColorStop(0, `rgba(0, 229, 255, ${0.8 * collapseProgress})`);
        glowGradient.addColorStop(0.5, `rgba(255, 0, 255, ${0.4 * collapseProgress})`);
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(centerX, targetY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Data waterfall effect
        ctx.strokeStyle = COLORS.cyan;
        ctx.lineWidth = 1;
        for (let i = 0; i < 30; i++) {
          const x = centerX + (i - 15) * 8;
          const startY = -50 + Math.sin(elapsedTime * 5 + i) * 30;
          const endY = targetY - 80 + Math.sin(elapsedTime * 3 + i * 0.5) * 20;
          
          ctx.globalAlpha = 0.3 + collapseProgress * 0.5;
          ctx.beginPath();
          ctx.moveTo(x, startY);
          ctx.lineTo(x, endY);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      }

      case 'reveal': {
        // Final glow effect behind logo
        const targetY = height * 0.4;
        const glowGradient = ctx.createRadialGradient(centerX, targetY, 0, centerX, targetY, 200);
        glowGradient.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
        glowGradient.addColorStop(0.3, 'rgba(255, 0, 255, 0.2)');
        glowGradient.addColorStop(0.6, 'rgba(229, 149, 0, 0.1)');
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(centerX, targetY, 200, 0, Math.PI * 2);
        ctx.fill();

        // Ambient floating particles
        particlesRef.current.forEach(p => {
          p.x += Math.sin(elapsedTime * 2 + p.hue) * 0.5;
          p.y += Math.cos(elapsedTime * 2 + p.hue * 0.5) * 0.3;
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = hslToString(p.hue, 80, 60, 0.3);
          ctx.fill();
        });
        break;
      }
    }
  }, [phase, elapsedTime, config, isMobile]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (time: number) => {
      const delta = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = time;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      render(ctx, width, height, Math.min(delta, 0.05));
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // Initialize on phase change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    initializePhase(phase, canvas.width / dpr, canvas.height / dpr);
  }, [phase, initializePhase]);

  return { particlesRef, gridLinesRef, polygonsRef };
};

// ============================================================================
// PROGRESS BAR COMPONENT
// ============================================================================

const ProgressBar = ({ progress, visible }: { progress: number; visible: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
    className="absolute bottom-32 left-1/2 -translate-x-1/2 w-64"
  >
    <div className="h-2 bg-black/50 rounded-full border border-cyan-500/50 overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500"
        style={{ 
          width: `${progress * 100}%`,
          boxShadow: '0 0 20px rgba(0, 229, 255, 0.8)',
        }}
        transition={{ duration: 0.1 }}
      />
    </div>
    <p className="text-center text-cyan-400 text-sm mt-2 font-mono">
      {Math.floor(progress * 100)}%
    </p>
  </motion.div>
);

// ============================================================================
// LOGO REVEAL COMPONENT
// ============================================================================

const LogoReveal = ({ visible }: { visible: boolean }) => {
  const tagline = "Instant worlds. One click away.";
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center z-20"
        >
          {/* Logo */}
          <motion.h1
            initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-bold mb-6 relative"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #F5A623 40%, #C68B1E 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(245, 166, 35, 0.6)) drop-shadow(0 0 60px rgba(255, 215, 0, 0.4))',
            }}
          >
            DinGaming
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg md:text-xl mb-10 tracking-wider"
            style={{ color: '#F5F5F5' }}
          >
            {tagline.split('').map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.02 }}
              >
                {char}
              </motion.span>
            ))}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// MAIN INTRO ANIMATION COMPONENT
// ============================================================================

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('void');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const startTimeRef = useRef<number>(0);
  const isMobile = useIsMobile();
  
  const timing = isMobile ? MOBILE_TIMING : TIMING;
  const totalDuration = timing.reveal.end;

  // Initialize canvas particle engine
  useDigitalWorldEngine(canvasRef, phase, isMobile, elapsedTime);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main timeline
  useEffect(() => {
    if (prefersReducedMotion) {
      setTimeout(onComplete, 300);
      return;
    }

    startTimeRef.current = performance.now();

    const tick = () => {
      const elapsed = (performance.now() - startTimeRef.current);
      setElapsedTime(elapsed / 1000);

      // Determine current phase
      if (elapsed < timing.void.end) {
        setPhase('void');
      } else if (elapsed < timing.spark.end) {
        setPhase('spark');
      } else if (elapsed < timing.world.end) {
        setPhase('world');
      } else if (elapsed < timing.chaos.end) {
        setPhase('chaos');
      } else if (elapsed < timing.collapse.end) {
        setPhase('collapse');
        // Calculate download progress
        const collapseProgress = (elapsed - timing.collapse.start) / (timing.collapse.end - timing.collapse.start);
        setDownloadProgress(Math.min(1, collapseProgress));
      } else if (elapsed < timing.reveal.end) {
        setPhase('reveal');
        setShowLogo(true);
      } else {
        // Auto-complete after reveal phase ends
        if (!isExiting) {
          setIsExiting(true);
          setTimeout(onComplete, 600);
        }
      }

      if (elapsed < totalDuration + 1500) {
        requestAnimationFrame(tick);
      }
    };

    const animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [timing, totalDuration, prefersReducedMotion, onComplete, isExiting]);


  // Handle skip
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

  if (prefersReducedMotion) {
    // Auto-enter for reduced motion users
    return null;
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ backgroundColor: COLORS.background }}
    >
      {/* Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ 
          willChange: 'transform',
          backgroundColor: COLORS.background,
        }}
      />

      {/* Scanline Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* Progress Bar */}
      <ProgressBar 
        progress={downloadProgress} 
        visible={phase === 'collapse'} 
      />

      {/* Logo Reveal */}
      <LogoReveal visible={showLogo} />

      {/* Skip Button */}
      {!showLogo && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          whileHover={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={handleSkip}
          className="absolute bottom-8 right-8 text-sm text-gray-500 hover:text-gray-300 transition-colors z-30"
        >
          Skip →
        </motion.button>
      )}
    </motion.div>
  );
};

export default IntroAnimation;
