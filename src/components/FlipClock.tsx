import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlipClockProps {
  targetDate: Date;
  onComplete?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabels?: boolean;
}

interface TimeUnit {
  value: number;
  label: string;
  key: string;
}

const FlipDigit = ({ 
  value, 
  size = "md" 
}: { 
  value: number; 
  size?: "sm" | "md" | "lg" 
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsFlipping(true);
      const timeout = setTimeout(() => {
        setDisplayValue(value);
        setIsFlipping(false);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [value, displayValue]);

  const sizeClasses = {
    sm: "w-8 h-10 text-lg",
    md: "w-12 h-14 text-2xl",
    lg: "w-16 h-20 text-4xl",
  };

  const formattedValue = String(displayValue).padStart(2, "0");

  return (
    <div className="flex gap-0.5">
      {formattedValue.split("").map((digit, i) => (
        <div
          key={i}
          className={cn(
            "relative overflow-hidden rounded-lg bg-card border border-border",
            sizeClasses[size]
          )}
        >
          {/* Static background */}
          <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-transparent" />
          
          {/* Center line */}
          <div className="absolute left-0 right-0 top-1/2 h-px bg-border/50 z-10" />
          
          {/* Digit */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${digit}-${i}`}
              className="absolute inset-0 flex items-center justify-center font-bold text-foreground"
              initial={isFlipping ? { rotateX: -90, opacity: 0 } : false}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: 90, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {digit}
            </motion.div>
          </AnimatePresence>

          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"
            animate={isFlipping ? { opacity: [0, 0.3, 0] } : {}}
            transition={{ duration: 0.3 }}
          />
        </div>
      ))}
    </div>
  );
};

const FlipClock = ({
  targetDate,
  onComplete,
  size = "md",
  className,
  showLabels = true,
}: FlipClockProps) => {
  const calculateTimeLeft = useCallback(() => {
    const difference = targetDate.getTime() - new Date().getTime();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (
        newTimeLeft.days === 0 &&
        newTimeLeft.hours === 0 &&
        newTimeLeft.minutes === 0 &&
        newTimeLeft.seconds === 0 &&
        !hasCompleted
      ) {
        setHasCompleted(true);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft, onComplete, hasCompleted]);

  const timeUnits: TimeUnit[] = [
    { value: timeLeft.days, label: "Dage", key: "days" },
    { value: timeLeft.hours, label: "Timer", key: "hours" },
    { value: timeLeft.minutes, label: "Min", key: "minutes" },
    { value: timeLeft.seconds, label: "Sek", key: "seconds" },
  ];

  // Filter out days if 0
  const displayUnits = timeUnits.filter(
    (unit) => unit.key !== "days" || unit.value > 0
  );

  const labelSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  const separatorSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {displayUnits.map((unit, index) => (
        <div key={unit.key} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <FlipDigit value={unit.value} size={size} />
            {showLabels && (
              <motion.span
                className={cn(
                  "mt-1 text-muted-foreground font-medium uppercase tracking-wider",
                  labelSizes[size]
                )}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {unit.label}
              </motion.span>
            )}
          </div>
          
          {index < displayUnits.length - 1 && (
            <motion.span
              className={cn(
                "font-bold text-muted-foreground pb-5",
                separatorSizes[size]
              )}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              :
            </motion.span>
          )}
        </div>
      ))}
    </div>
  );
};

export default FlipClock;
