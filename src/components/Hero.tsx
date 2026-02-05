import { Button } from "@/components/ui/button";
import { Zap, Shield, Star, ChevronRight, CheckCircle2, Clock, TrendingUp, Gamepad2 } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import game1 from "@/assets/game-1.jpg";
import game2 from "@/assets/game-2.jpg";
import game3 from "@/assets/game-3.jpg";
import game4 from "@/assets/game-4.jpg";
import game5 from "@/assets/game-5.jpg";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";

// Floating game covers data
const floatingGames = [
  { img: game2, x: '8%', y: '15%', size: 'w-20', delay: 0, rotate: -12 },
  { img: game3, x: '85%', y: '20%', size: 'w-24', delay: 0.2, rotate: 8 },
  { img: game4, x: '5%', y: '65%', size: 'w-16', delay: 0.4, rotate: 15 },
  { img: game5, x: '90%', y: '70%', size: 'w-18', delay: 0.6, rotate: -8 },
];

// Particle system
const Particles = () => {
  const particles = useMemo(() => 
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Stats counter component
const AnimatedStat = ({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <div className="text-center">
      <div className="text-2xl lg:text-3xl font-bold text-foreground">
        {count.toLocaleString('da-DK')}{suffix}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
};

const Hero = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 32 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [tickingUnit, setTickingUnit] = useState<'seconds' | 'minutes' | 'hours' | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // Mouse parallax - optimized with higher damping for smoother motion
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 50, stiffness: 100, mass: 0.5 };
  const orbX = useSpring(useTransform(mouseX, [0, 1], [-15, 15]), springConfig);
  const orbY = useSpring(useTransform(mouseY, [0, 1], [-10, 10]), springConfig);
  const cardX = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), springConfig);
  const cardY = useSpring(useTransform(mouseY, [0, 1], [-4, 4]), springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Trigger entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Countdown with tick animation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        const prevSeconds = seconds;
        seconds--;
        
        if (seconds < 0) { 
          seconds = 59; 
          minutes--;
          setTickingUnit('minutes');
        } else {
          setTickingUnit('seconds');
        }
        
        if (minutes < 0) { 
          minutes = 59; 
          hours--;
          setTickingUnit('hours');
        }
        
        if (hours < 0) { 
          hours = 23; 
          minutes = 59; 
          seconds = 59; 
        }
        
        // Clear tick animation after short delay
        setTimeout(() => setTickingUnit(null), 150);
        
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Animation variants - optimized for GPU, no blur filters
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
        delay: 0.2,
      },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const,
        delay: 0.15 + i * 0.05,
      },
    }),
  };

  return (
    <section ref={heroRef} className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
      {/* Cinematic Background with layered depth */}
      <div className="absolute inset-0 z-0">
        {/* Base image with zoom reveal */}
        <motion.img 
          src={heroBg} 
          alt="" 
          className="w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.2, filter: 'blur(20px)' }}
          animate={{ opacity: 0.25, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 2.5, ease: "easeOut" }}
        />
        
        {/* Layered gradients for depth */}
        <motion.div 
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
        </motion.div>
        
        {/* Animated ambient glow orbs - warm tones */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[700px] h-[700px] rounded-full blur-[150px]" 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          style={{ 
            x: orbX,
            y: orbY,
            background: 'radial-gradient(circle, hsl(38 92% 50% / 0.25), transparent 70%)' 
          }} 
        />
        <motion.div 
          className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] rounded-full blur-[130px]" 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.2, scale: 1 }}
          transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
          style={{ 
            x: useTransform(orbX, v => -v * 0.7),
            y: useTransform(orbY, v => -v * 0.7),
            background: 'radial-gradient(circle, hsl(15 75% 60% / 0.2), transparent 70%)' 
          }} 
        />
        
        {/* NEW: Third orb for more depth */}
        <motion.div 
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full blur-[120px]" 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ duration: 2, delay: 1, ease: "easeOut" }}
          style={{ 
            x: useTransform(orbX, v => v * 0.5),
            y: useTransform(orbY, v => v * 0.5),
            background: 'radial-gradient(circle, hsl(158 64% 42% / 0.1), transparent 70%)' 
          }} 
        />

        {/* Particle system */}
        <Particles />

        {/* Floating game covers */}
        <div className="hidden lg:block">
          {floatingGames.map((game, i) => (
            <motion.div
              key={i}
              className={`absolute ${game.size} aspect-[3/4] rounded-xl overflow-hidden shadow-2xl`}
              style={{ left: game.x, top: game.y }}
              initial={{ opacity: 0, y: 50, rotate: game.rotate }}
              animate={{ 
                opacity: 0.6, 
                y: 0,
                rotate: game.rotate,
              }}
              transition={{ delay: 1 + game.delay, duration: 0.8, ease: "easeOut" }}
            >
              <motion.img
                src={game.img}
                alt=""
                className="w-full h-full object-cover"
                animate={{ y: [0, -8, 0] }}
                transition={{ 
                  duration: 4 + i * 0.5, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: game.delay 
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </motion.div>
          ))}
        </div>

        {/* Grid overlay for texture */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
          >
            {/* Enhanced Trust indicators with bounce */}
            <motion.div className="flex flex-wrap items-center gap-3 mb-8" variants={itemVariants}>
              {[
                { icon: CheckCircle2, text: "Officielle Keys" },
                { icon: Zap, text: "30 sek levering" },
              ].map((badge, i) => (
                <motion.div
                  key={badge.text}
                  className="trust-badge"
                  variants={badgeVariants}
                  custom={i}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <badge.icon className="w-4 h-4" />
                  {badge.text}
                </motion.div>
              ))}
              <motion.div
                className="trustpilot-badge"
                variants={badgeVariants}
                custom={2}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.08, type: "spring", stiffness: 400 }}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </motion.div>
                  ))}
                </div>
                <span>4.9</span>
                <span className="opacity-70">Trustpilot</span>
              </motion.div>
            </motion.div>

            {/* Headline with elegant typography */}
            <motion.h1 
              className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-foreground mb-6 leading-[1.1] text-balance"
              variants={itemVariants}
            >
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              >
                Køb Game Keys.
              </motion.span>
              <br />
              <motion.span 
                className="inline-block text-primary"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              >
                Spar op til 70%.
              </motion.span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed"
              variants={itemVariants}
            >
              Danmarks største udvalg af digitale game keys. 
              Leveret til din email{" "}
              <span className="text-primary font-medium">øjeblikkeligt</span>.
            </motion.p>

            {/* Enhanced CTAs - refined, no aggressive glow */}
            <motion.div 
              className="flex flex-col sm:flex-row items-start gap-4 mb-10"
              variants={itemVariants}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button 
                  size="xl" 
                  className="group text-base shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
                >
                  Se Alle Spil
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>
              <motion.button 
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-secondary border border-border text-foreground hover:border-primary/30 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <span>Dagens Tilbud</span>
                <span className="px-2.5 py-1 rounded-lg bg-accent/15 text-accent text-xs font-semibold">
                  -70%
                </span>
              </motion.button>
            </motion.div>

            {/* Guarantees */}
            <motion.div 
              className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-muted-foreground mb-10"
              variants={itemVariants}
            >
              {[
                { icon: Shield, text: "Pengene tilbage garanti" },
                { icon: Clock, text: "24/7 Dansk support" },
                { icon: Gamepad2, text: "50.000+ spil" },
              ].map((item, i) => (
                <motion.div 
                  key={item.text}
                  className="flex items-center gap-2.5 hover:text-foreground transition-colors cursor-default group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  whileHover={{ x: 4 }}
                >
                  <motion.div 
                    className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    <item.icon className="w-4 h-4 text-primary" />
                  </motion.div>
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Stats bar */}
            <motion.div 
              className="grid grid-cols-3 gap-6 p-5 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <AnimatedStat value={847293} label="Keys Solgt" />
              <AnimatedStat value={50000} label="Spil Tilgængelige" suffix="+" />
              <AnimatedStat value={99} label="Kundetilfredshed" suffix="%" />
            </motion.div>
          </motion.div>

          {/* Right: Premium Featured Deal Card with 3D hover */}
          <motion.div 
            className="hidden lg:block"
            variants={cardVariants}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            style={{ x: cardX, y: cardY }}
          >
            <motion.div 
              className="featured-card"
              whileHover={{ 
                scale: 1.01,
                boxShadow: "0 40px 80px -20px hsl(0 0% 0% / 0.6)"
              }}
              transition={{ duration: 0.4 }}
            >
              {/* Elegant header banner */}
              <div className="relative py-4 px-6 overflow-hidden" 
                style={{ background: 'linear-gradient(135deg, hsl(38 92% 50%), hsl(38 80% 40%))' }}>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-semibold text-sm tracking-wide">Ugens Bedste Tilbud</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-sm font-semibold">
                    {[
                      { value: timeLeft.hours, unit: 'hours' },
                      { value: timeLeft.minutes, unit: 'minutes' },
                      { value: timeLeft.seconds, unit: 'seconds' },
                    ].map((item, i) => (
                      <div key={item.unit} className="flex items-center">
                        {i > 0 && <span className="text-background/60 mx-1">:</span>}
                        <motion.span 
                          className={`bg-background/25 backdrop-blur-sm px-2.5 py-1.5 rounded-lg ${
                            tickingUnit === item.unit ? 'countdown-tick tick' : ''
                          }`}
                          key={`${item.unit}-${item.value}`}
                          initial={tickingUnit === item.unit ? { scale: 1.15 } : { scale: 1 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.15 }}
                        >
                          {String(item.value).padStart(2, '0')}
                        </motion.span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex gap-6">
                  {/* Game image with hover zoom */}
                  <div className="w-36 flex-shrink-0">
                    <motion.div 
                      className="relative rounded-xl overflow-hidden"
                      whileHover={{ scale: 1.05 }}
                    >
                      <motion.img 
                        src={game1} 
                        alt="Shadow Warrior" 
                        className="w-full aspect-[3/4] object-cover"
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.8 }}
                      />
                      <motion.div 
                        className="absolute top-2 left-2 px-2 py-1 rounded bg-destructive text-destructive-foreground text-xs font-bold"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.8, type: "spring", stiffness: 400 }}
                      >
                        -33%
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded bg-muted text-xs font-medium text-muted-foreground">Steam</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                        <span className="text-xs text-muted-foreground">4.8 (2.4k)</span>
                      </div>
                    </div>

                    <h3 className="font-heading text-xl font-bold text-foreground mb-1">
                      Shadow Warrior: Legends
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      Episk action-eventyr med intens sværdkamp og magiske evner.
                    </p>

                    {/* Price section */}
                    <motion.div 
                      className="mb-5 p-3 -mx-3 rounded-xl bg-primary/5"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                    >
                      <div className="flex items-baseline gap-3 mb-1">
                        <motion.span 
                          className="price-hero-lg"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.7, type: "spring", stiffness: 300 }}
                        >
                          299 kr
                        </motion.span>
                        <span className="text-lg text-muted-foreground line-through opacity-60">449 kr</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.span 
                          className="px-2 py-0.5 rounded bg-success/15 text-success text-sm font-medium"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 }}
                        >
                          Du sparer 150 kr
                        </motion.span>
                      </div>
                    </motion.div>

                    {/* Stock indicator - refined */}
                    <div className="flex items-center gap-2 mb-4 text-sm">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-accent rounded-full origin-left"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 0.3 }}
                          transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-accent font-medium whitespace-nowrap text-xs">
                        Kun 47 tilbage
                      </span>
                    </div>

                    {/* CTA */}
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        Køb Nu - Levering på 30 sek
                      </Button>
                    </motion.div>

                    <motion.div 
                      className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                    >
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        Officiel key
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        Garanti
                      </span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Social proof under card with stagger */}
            <motion.div 
              className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
            >
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <motion.div 
                    key={i} 
                    className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.4 + i * 0.1, type: "spring" }}
                  >
                    {['MK', 'SL', 'JH', 'AK'][i]}
                  </motion.div>
                ))}
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
              >
                +127 har købt dette spil i dag
              </motion.span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;