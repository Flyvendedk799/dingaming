import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef, MouseEvent } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface GameRoomCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  gradient: string;
  iconColor: string;
  borderColor: string;
  badge?: string;
  delay?: number;
}

const GameRoomCard = ({
  title,
  description,
  icon: Icon,
  href,
  gradient,
  iconColor,
  borderColor,
  badge,
  delay = 0,
}: GameRoomCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
    >
      <Link to={href}>
        <motion.div
          ref={cardRef}
          className={cn(
            "relative p-6 rounded-3xl cursor-pointer overflow-hidden",
            "border backdrop-blur-sm",
            borderColor
          )}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
            perspective: 1000,
            background: gradient,
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${useTransform(
                mouseX,
                [-0.5, 0.5],
                ["0%", "100%"]
              )} ${useTransform(
                mouseY,
                [-0.5, 0.5],
                ["0%", "100%"]
              )}, rgba(255,255,255,0.15) 0%, transparent 50%)`,
            }}
          />

          {badge && (
            <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase">
              {badge}
            </div>
          )}

          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
              "backdrop-blur-sm border border-white/10"
            )}
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <Icon className={cn("w-8 h-8", iconColor)} />
          </div>

          <h3 className="font-heading text-2xl text-white mb-2">{title}</h3>
          <p className="text-white/60 text-sm">{description}</p>

          <motion.div
            className="mt-4 flex items-center text-white/80 text-sm font-medium"
            whileHover={{ x: 5 }}
          >
            Spil nu
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default GameRoomCard;
