import { motion } from "framer-motion";

interface CasinoBackgroundProps {
  variant?: "lobby" | "mines" | "dice" | "blackjack" | "roulette";
}

const CasinoBackground = ({ variant = "lobby" }: CasinoBackgroundProps) => {
  const colors = {
    lobby: {
      primary: "hsl(270, 60%, 10%)",
      secondary: "hsl(280, 50%, 15%)",
      accent: "hsl(45, 90%, 50%)",
    },
    mines: {
      primary: "hsl(160, 50%, 8%)",
      secondary: "hsl(160, 40%, 12%)",
      accent: "hsl(160, 80%, 45%)",
    },
    dice: {
      primary: "hsl(220, 60%, 10%)",
      secondary: "hsl(230, 50%, 15%)",
      accent: "hsl(200, 90%, 55%)",
    },
    blackjack: {
      primary: "hsl(30, 50%, 8%)",
      secondary: "hsl(25, 40%, 12%)",
      accent: "hsl(38, 90%, 50%)",
    },
    roulette: {
      primary: "hsl(0, 50%, 8%)",
      secondary: "hsl(350, 40%, 12%)",
      accent: "hsl(0, 80%, 50%)",
    },
  };

  const c = colors[variant];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(145deg, ${c.primary} 0%, ${c.secondary} 50%, ${c.primary} 100%)`,
        }}
      />

      {/* Animated orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
        style={{ background: c.accent, top: "-20%", left: "-10%" }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-15"
        style={{ background: c.accent, bottom: "-15%", right: "-5%" }}
        animate={{
          x: [0, -40, 0],
          y: [0, -20, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            delay: Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </div>
  );
};

export default CasinoBackground;
