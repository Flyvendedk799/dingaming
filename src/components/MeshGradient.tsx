import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MeshGradientProps {
  className?: string;
  intensity?: "subtle" | "medium" | "strong";
  colors?: "primary" | "accent" | "success" | "mixed";
  animate?: boolean;
}

const colorSets = {
  primary: [
    "hsl(var(--primary) / 0.15)",
    "hsl(var(--primary) / 0.08)",
    "hsl(var(--primary) / 0.12)",
  ],
  accent: [
    "hsl(var(--accent) / 0.15)",
    "hsl(var(--accent) / 0.08)",
    "hsl(var(--accent) / 0.12)",
  ],
  success: [
    "hsl(var(--success) / 0.12)",
    "hsl(var(--success) / 0.06)",
    "hsl(var(--success) / 0.1)",
  ],
  mixed: [
    "hsl(var(--primary) / 0.12)",
    "hsl(var(--accent) / 0.1)",
    "hsl(var(--success) / 0.08)",
  ],
};

const intensityValues = {
  subtle: 0.6,
  medium: 1,
  strong: 1.4,
};

const MeshGradient = ({
  className,
  intensity = "medium",
  colors = "mixed",
  animate = true,
}: MeshGradientProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const colorSet = colorSets[colors];
  const intensityMultiplier = intensityValues[intensity];

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className
      )}
    >
      {/* Blob 1 */}
      <motion.div
        className="absolute w-[60%] h-[60%] rounded-full blur-3xl"
        style={{
          background: colorSet[0],
          opacity: 0.6 * intensityMultiplier,
        }}
        animate={
          animate
            ? {
                x: ["0%", "20%", "-10%", "0%"],
                y: ["0%", "-15%", "10%", "0%"],
                scale: [1, 1.1, 0.95, 1],
              }
            : {}
        }
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        initial={{ left: "-10%", top: "-20%" }}
      />

      {/* Blob 2 */}
      <motion.div
        className="absolute w-[50%] h-[50%] rounded-full blur-3xl"
        style={{
          background: colorSet[1],
          opacity: 0.5 * intensityMultiplier,
        }}
        animate={
          animate
            ? {
                x: ["0%", "-25%", "15%", "0%"],
                y: ["0%", "20%", "-10%", "0%"],
                scale: [1, 0.9, 1.15, 1],
              }
            : {}
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        initial={{ right: "-15%", top: "30%" }}
      />

      {/* Blob 3 */}
      <motion.div
        className="absolute w-[45%] h-[45%] rounded-full blur-3xl"
        style={{
          background: colorSet[2],
          opacity: 0.4 * intensityMultiplier,
        }}
        animate={
          animate
            ? {
                x: ["0%", "15%", "-20%", "0%"],
                y: ["0%", "-10%", "25%", "0%"],
                scale: [1, 1.2, 0.85, 1],
              }
            : {}
        }
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        initial={{ left: "20%", bottom: "-10%" }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default MeshGradient;
