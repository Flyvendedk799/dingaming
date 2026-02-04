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
  gold: '#E59500',
  white: '#E8E8E8',
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
        // Blinking cursor
        const cursorBlink = Math.sin(elapsedTime * 8) > 0;
        if (cursorBlink) {
          ctx.fillStyle = COLORS.cyan;
          ctx.shadowColor = COLORS.cyan;
          ctx.shadowBlur = 10;
          ctx.fillRect(centerX - 6, centerY - 12, 12, 24);
          ctx.shadowBlur = 0;
        }

        // Scanlines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        for (let y = 0; y < height; y += 3) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Subtle noise
        const noiseIntensity = 0.03;
        for (let i = 0; i < 50; i++) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * noiseIntensity})`;
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
        const genreIndex = Math.floor(chaosProgress * genres.length);
        const currentGenre = genres[Math.min(genreIndex, genres.length - 1)];
        
        // RGB split / glitch effect
        const glitchIntensity = Math.sin(chaosProgress * Math.PI * genres.length) * 0.5 + 0.5;
        
        // Genre-specific rendering
        ctx.save();
        
        // Screen shake
        const shakeIntensity = 8 * glitchIntensity;
        ctx.translate(
          Math.sin(elapsedTime * 30) * shakeIntensity,
          Math.cos(elapsedTime * 25) * shakeIntensity
        );

        switch (currentGenre) {
          case 'fps':
            // Crosshair
            ctx.strokeStyle = COLORS.lime;
            ctx.lineWidth = 2;
            ctx.shadowColor = COLORS.lime;
            ctx.shadowBlur = 15;
            
            const crossSize = 30;
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
            
            // Ammo counter
            ctx.fillStyle = COLORS.lime;
            ctx.font = 'bold 24px monospace';
            ctx.fillText('30 / 90', width - 120, height - 40);
            
            // Radar pulse
            ctx.beginPath();
            ctx.arc(80, height - 80, 40, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 255, 0, ${0.5 + Math.sin(elapsedTime * 10) * 0.3})`;
            ctx.stroke();
            ctx.shadowBlur = 0;
            break;

          case 'racing':
            // Speed lines
            ctx.strokeStyle = COLORS.cyan;
            ctx.lineWidth = 3;
            for (let i = 0; i < 20; i++) {
              const angle = (i / 20) * Math.PI * 2;
              const innerR = 100;
              const outerR = 300 + Math.random() * 200;
              ctx.beginPath();
              ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
              ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
              ctx.globalAlpha = 0.5 + Math.random() * 0.5;
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
            
            // Speedometer
            ctx.beginPath();
            ctx.arc(width - 100, height - 100, 60, Math.PI * 0.7, Math.PI * 2.3);
            ctx.strokeStyle = COLORS.magenta;
            ctx.lineWidth = 4;
            ctx.stroke();
            
            ctx.fillStyle = COLORS.white;
            ctx.font = 'bold 28px monospace';
            ctx.fillText('280', width - 130, height - 90);
            break;

          case 'rpg':
            // Health orb
            const orbGradient = ctx.createRadialGradient(100, height - 100, 0, 100, height - 100, 50);
            orbGradient.addColorStop(0, 'rgba(255, 50, 50, 0.8)');
            orbGradient.addColorStop(1, 'rgba(150, 0, 0, 0.6)');
            ctx.fillStyle = orbGradient;
            ctx.beginPath();
            ctx.arc(100, height - 100, 50, 0, Math.PI * 2);
            ctx.fill();
            
            // Mana bar
            ctx.fillStyle = 'rgba(50, 100, 255, 0.8)';
            ctx.fillRect(width - 200, height - 50, 180, 20);
            ctx.strokeStyle = COLORS.cyan;
            ctx.strokeRect(width - 200, height - 50, 180, 20);
            
            // Quest marker
            ctx.fillStyle = COLORS.gold;
            ctx.font = 'bold 32px sans-serif';
            ctx.fillText('!', centerX, 80);
            break;

          case 'strategy':
            // Grid tiles
            const tileSize = 50;
            ctx.strokeStyle = COLORS.cyan;
            ctx.lineWidth = 1;
            for (let gx = 0; gx < width / tileSize; gx++) {
              for (let gy = 0; gy < height / tileSize; gy++) {
                ctx.globalAlpha = 0.2 + Math.random() * 0.3;
                ctx.strokeRect(gx * tileSize, gy * tileSize, tileSize, tileSize);
              }
            }
            ctx.globalAlpha = 1;
            
            // Unit icons
            const units = [[200, 200], [350, 280], [480, 220]];
            units.forEach(([ux, uy]) => {
              ctx.beginPath();
              ctx.arc(ux, uy, 20, 0, Math.PI * 2);
              ctx.fillStyle = COLORS.lime;
              ctx.fill();
            });
            
            // Resource counter
            ctx.fillStyle = COLORS.gold;
            ctx.font = 'bold 20px monospace';
            ctx.fillText('⬢ 1,250  ◆ 890  ⬡ 450', 20, 30);
            break;
        }

        ctx.restore();

        // Burst particles
        particlesRef.current.forEach(p => {
          if (p.type !== 'burst') return;
          
          p.x += p.vx * delta * 60;
          p.y += p.vy * delta * 60;
          p.vx *= 0.98;
          p.vy *= 0.98;
          p.opacity = Math.max(0, p.opacity - delta * 2);

          if (p.opacity > 0) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = hslToString(p.hue, 100, 60, p.opacity);
            ctx.fill();
          }
        });

        // Glitch lines
        if (glitchIntensity > 0.7) {
          for (let i = 0; i < 5; i++) {
            const y = Math.random() * height;
            const h = Math.random() * 10 + 2;
            ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255, 0, 255' : '0, 255, 255'}, ${Math.random() * 0.5})`;
            ctx.fillRect(0, y, width, h);
          }
        }
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

const LogoReveal = ({ visible, onEnterClick }: { visible: boolean; onEnterClick: () => void }) => {
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
              background: 'linear-gradient(135deg, #00E5FF 0%, #FF00FF 50%, #E59500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 60px rgba(0, 229, 255, 0.5), 0 0 120px rgba(255, 0, 255, 0.3)',
            }}
          >
            DinGaming
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg md:text-xl text-gray-300 mb-10 tracking-wider"
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

          {/* Enter Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            onClick={onEnterClick}
            className="group relative px-8 py-4 text-lg font-semibold tracking-wider overflow-hidden rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(255, 0, 255, 0.2) 100%)',
              border: '2px solid rgba(0, 229, 255, 0.8)',
              color: '#00E5FF',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Pulse animation */}
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-fuchsia-500/30"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: 0 }}
            />
            
            {/* Shimmer effect */}
            <motion.span
              className="absolute inset-0 opacity-0 group-hover:opacity-100"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              }}
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
            />
            
            <span className="relative z-10">ENTER STORE</span>
          </motion.button>
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
      }

      if (elapsed < totalDuration + 500) {
        requestAnimationFrame(tick);
      }
    };

    const animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [timing, totalDuration, prefersReducedMotion, onComplete]);

  // Handle enter store click
  const handleEnterStore = () => {
    setIsExiting(true);
    setTimeout(onComplete, 600);
  };

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
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a1a] flex items-center justify-center">
        <button
          onClick={handleEnterStore}
          className="px-8 py-4 text-lg font-semibold text-cyan-400 border-2 border-cyan-500 rounded-lg hover:bg-cyan-500/20 transition-colors"
        >
          ENTER STORE
        </button>
      </div>
    );
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
      <LogoReveal 
        visible={showLogo} 
        onEnterClick={handleEnterStore} 
      />

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
