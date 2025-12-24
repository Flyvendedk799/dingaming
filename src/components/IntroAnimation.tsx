import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import game1 from "@/assets/game-1.jpg";
import game2 from "@/assets/game-2.jpg";
import game3 from "@/assets/game-3.jpg";
import game4 from "@/assets/game-4.jpg";
import game5 from "@/assets/game-5.jpg";
import game6 from "@/assets/game-6.jpg";

const games = [
  { image: game1, name: "Elden Ring" },
  { image: game2, name: "Cyberpunk 2077" },
  { image: game3, name: "God of War" },
  { image: game4, name: "Hogwarts Legacy" },
  { image: game5, name: "Red Dead 2" },
  { image: game6, name: "Baldur's Gate 3" },
];

// Create extended array for smooth spinning
const extendedGames = [...games, ...games, ...games, ...games, ...games, ...games, ...games, ...games];

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<'spinning' | 'slowdown' | 'landed' | 'reveal' | 'complete'>('spinning');
  const [spinOffset, setSpinOffset] = useState(0);
  const spinRef = useRef<number>(0);
  const speedRef = useRef<number>(60); // Starting speed
  const containerRef = useRef<HTMLDivElement>(null);

  // Spinning animation
  useEffect(() => {
    if (phase !== 'spinning' && phase !== 'slowdown') return;

    const cardWidth = 220; // Width of each card + gap
    let animationId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Update position
      spinRef.current += speedRef.current * deltaTime * cardWidth;
      setSpinOffset(spinRef.current);

      // Start slowdown after 2 seconds
      if (phase === 'spinning' && spinRef.current > cardWidth * 15) {
        setPhase('slowdown');
      }

      // Gradual slowdown
      if (phase === 'slowdown') {
        speedRef.current *= 0.985; // Deceleration

        // Stop when slow enough
        if (speedRef.current < 0.3) {
          setPhase('landed');
          return;
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [phase]);

  // Sequence phases
  useEffect(() => {
    if (phase === 'landed') {
      // Pause on landing, then reveal
      const timer = setTimeout(() => setPhase('reveal'), 800);
      return () => clearTimeout(timer);
    }
    if (phase === 'reveal') {
      // After reveal animation, complete
      const timer = setTimeout(() => setPhase('complete'), 2500);
      return () => clearTimeout(timer);
    }
    if (phase === 'complete') {
      onComplete();
    }
  }, [phase, onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'complete' && (
        <motion.div
          className="fixed inset-0 z-[100] bg-background overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Background effects */}
          <div className="absolute inset-0">
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  'radial-gradient(ellipse at 30% 50%, hsl(142 70% 20% / 0.3) 0%, transparent 50%)',
                  'radial-gradient(ellipse at 70% 50%, hsl(142 70% 25% / 0.4) 0%, transparent 50%)',
                  'radial-gradient(ellipse at 30% 50%, hsl(142 70% 20% / 0.3) 0%, transparent 50%)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Particle effects */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-success/40"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -100, 0],
                    x: [0, Math.random() * 40 - 20, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            {/* Light beams */}
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-gradient-to-b from-success via-success/50 to-transparent"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>

          {/* Case opening spinner */}
          {(phase === 'spinning' || phase === 'slowdown' || phase === 'landed') && (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Selection indicator - the target line */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <motion.div
                  className="w-[200px] h-[280px] border-4 border-success rounded-xl"
                  animate={{
                    boxShadow: [
                      '0 0 20px hsl(142 70% 45% / 0.5), inset 0 0 30px hsl(142 70% 45% / 0.1)',
                      '0 0 40px hsl(142 70% 45% / 0.8), inset 0 0 50px hsl(142 70% 45% / 0.2)',
                      '0 0 20px hsl(142 70% 45% / 0.5), inset 0 0 30px hsl(142 70% 45% / 0.1)',
                    ],
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
                {/* Arrow indicator */}
                <motion.div
                  className="absolute -top-8 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-success"
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                />
              </div>

              {/* Spinning cards container */}
              <div 
                ref={containerRef}
                className="flex items-center gap-5 will-change-transform"
                style={{ 
                  transform: `translateX(${-spinOffset + window.innerWidth / 2 - 100}px)`,
                }}
              >
                {extendedGames.map((game, index) => (
                  <motion.div
                    key={index}
                    className="flex-shrink-0 w-[200px] h-[260px] rounded-xl overflow-hidden border-2 border-border/50 shadow-2xl"
                    style={{
                      background: 'linear-gradient(145deg, hsl(220 20% 12%), hsl(220 20% 8%))',
                    }}
                  >
                    <img
                      src={game.image}
                      alt={game.name}
                      className="w-full h-[200px] object-cover"
                    />
                    <div className="p-3 text-center">
                      <p className="text-sm font-semibold text-foreground truncate">{game.name}</p>
                    </div>
                  </motion.div>
                ))}
                
                {/* THE WINNING CARD - DinGaming */}
                <motion.div
                  className="flex-shrink-0 w-[200px] h-[260px] rounded-xl overflow-hidden relative"
                  style={{
                    background: 'linear-gradient(145deg, hsl(142 70% 20%), hsl(142 70% 10%))',
                    border: '3px solid hsl(142 70% 45%)',
                    boxShadow: '0 0 30px hsl(142 70% 45% / 0.5)',
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                      className="text-4xl font-heading font-bold"
                      animate={phase === 'landed' ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      <span className="text-foreground">Din</span>
                      <span className="text-success">Gaming</span>
                    </motion.div>
                    <p className="text-success/70 text-sm mt-2">🎮 Din Gaming Univers</p>
                  </div>
                  
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                  />
                </motion.div>

                {/* More games after */}
                {extendedGames.slice(0, 10).map((game, index) => (
                  <motion.div
                    key={`after-${index}`}
                    className="flex-shrink-0 w-[200px] h-[260px] rounded-xl overflow-hidden border-2 border-border/50 shadow-2xl"
                    style={{
                      background: 'linear-gradient(145deg, hsl(220 20% 12%), hsl(220 20% 8%))',
                    }}
                  >
                    <img
                      src={game.image}
                      alt={game.name}
                      className="w-full h-[200px] object-cover"
                    />
                    <div className="p-3 text-center">
                      <p className="text-sm font-semibold text-foreground truncate">{game.name}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Speed blur effect on edges */}
              <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
              <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
            </div>
          )}

          {/* Landing celebration */}
          {phase === 'landed' && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Explosion particles */}
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                  style={{
                    background: i % 2 === 0 ? 'hsl(142 70% 45%)' : 'hsl(45 100% 51%)',
                  }}
                  initial={{ x: 0, y: 0, scale: 0 }}
                  animate={{
                    x: (Math.random() - 0.5) * 600,
                    y: (Math.random() - 0.5) * 400,
                    scale: [0, 1.5, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              ))}
            </motion.div>
          )}

          {/* Epic reveal phase */}
          {phase === 'reveal' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Radial light burst */}
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.3] }}
                transition={{ duration: 1.5 }}
                style={{
                  background: 'radial-gradient(circle at center, hsl(142 70% 45% / 0.3) 0%, transparent 60%)',
                }}
              />

              {/* Main logo reveal */}
              <div className="relative z-10 text-center">
                <motion.div
                  className="relative"
                  initial={{ scale: 0.5, opacity: 0, rotateX: 90 }}
                  animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  {/* Glow behind text */}
                  <motion.div
                    className="absolute -inset-20 blur-3xl"
                    animate={{
                      background: [
                        'radial-gradient(circle, hsl(142 70% 45% / 0.4) 0%, transparent 70%)',
                        'radial-gradient(circle, hsl(142 70% 50% / 0.6) 0%, transparent 70%)',
                        'radial-gradient(circle, hsl(142 70% 45% / 0.4) 0%, transparent 70%)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  <motion.h1
                    className="font-heading text-7xl md:text-9xl font-bold relative"
                    animate={{ 
                      textShadow: [
                        '0 0 20px hsl(142 70% 45% / 0.5)',
                        '0 0 60px hsl(142 70% 45% / 0.8)',
                        '0 0 20px hsl(142 70% 45% / 0.5)',
                      ]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="text-foreground">Din</span>
                    <span className="text-gradient-success">Gaming</span>
                  </motion.h1>
                </motion.div>

                <motion.p
                  className="text-2xl text-muted-foreground mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  Dit Gaming Univers Åbner...
                </motion.p>

                {/* Loading bar */}
                <motion.div
                  className="mt-8 mx-auto w-64 h-1 bg-muted rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-success to-success/70 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
                  />
                </motion.div>
              </div>

              {/* Floating game icons around */}
              {games.map((game, i) => (
                <motion.div
                  key={i}
                  className="absolute w-16 h-20 rounded-lg overflow-hidden border border-success/30 shadow-lg"
                  style={{
                    left: `${15 + (i % 3) * 30}%`,
                    top: `${20 + Math.floor(i / 3) * 40}%`,
                  }}
                  initial={{ opacity: 0, scale: 0, rotate: -20 }}
                  animate={{ 
                    opacity: 0.6, 
                    scale: 1, 
                    rotate: 0,
                    y: [0, -10, 0],
                  }}
                  transition={{ 
                    delay: 0.3 + i * 0.1,
                    duration: 0.5,
                    y: { duration: 2, repeat: Infinity, delay: i * 0.2 }
                  }}
                >
                  <img src={game.image} alt="" className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Sound visualization bars (decorative) */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-end gap-1">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-success/50 rounded-full"
                animate={{
                  height: [10, 20 + Math.random() * 30, 10],
                }}
                transition={{
                  duration: 0.3 + Math.random() * 0.3,
                  repeat: Infinity,
                  delay: i * 0.05,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroAnimation;