import { Button } from "@/components/ui/button";
import { Zap, Shield, Star, ChevronRight, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import game1 from "@/assets/game-1.jpg";
import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

const Hero = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 32 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [tickingUnit, setTickingUnit] = useState<'seconds' | 'minutes' | 'hours' | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // Mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const orbX = useSpring(useTransform(mouseX, [0, 1], [-30, 30]), springConfig);
  const orbY = useSpring(useTransform(mouseY, [0, 1], [-20, 20]), springConfig);
  const cardX = useSpring(useTransform(mouseX, [0, 1], [-10, 10]), springConfig);
  const cardY = useSpring(useTransform(mouseY, [0, 1], [-8, 8]), springConfig);

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 60 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: "easeOut" as const,
        delay: 0.4,
      },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        type: "spring" as const,
        stiffness: 300,
        delay: 0.3 + i * 0.1,
      },
    }),
  };

  return (
    <section ref={heroRef} className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
      {/* Enhanced Background with animated parallax orbs */}
      <div className="absolute inset-0 z-0">
        <motion.img 
          src={heroBg} 
          alt="" 
          className="w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
        
        {/* Animated ambient glow orbs with parallax */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] ambient-orb" 
          style={{ 
            x: orbX,
            y: orbY,
            background: 'radial-gradient(circle, hsl(142 70% 45% / 0.35), transparent 70%)' 
          }} 
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] ambient-orb-delayed" 
          style={{ 
            x: useTransform(orbX, v => -v * 0.7),
            y: useTransform(orbY, v => -v * 0.7),
            background: 'radial-gradient(circle, hsl(45 100% 51% / 0.25), transparent 70%)' 
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
                  className="trust-badge magnetic-hover"
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
                className="trustpilot-badge magnetic-hover"
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

            {/* Headline with text reveal */}
            <motion.h1 
              className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 leading-[1.05] text-balance"
              variants={itemVariants}
            >
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Køb Game Keys.
              </motion.span>
              <br />
              <motion.span 
                className="text-gradient-success inline-block"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
              <motion.span 
                className="text-success font-medium inline-block"
                animate={{ 
                  textShadow: [
                    "0 0 0px hsl(142 70% 45% / 0)",
                    "0 0 20px hsl(142 70% 45% / 0.5)",
                    "0 0 0px hsl(142 70% 45% / 0)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                øjeblikkeligt
              </motion.span>.
            </motion.p>

            {/* Enhanced CTAs with glow pulse */}
            <motion.div 
              className="flex flex-col sm:flex-row items-start gap-4 mb-10"
              variants={itemVariants}
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="success" 
                  size="xl" 
                  className="group text-base shadow-glow-success btn-primary glow-pulse ripple"
                >
                  <Zap className="w-5 h-5 transition-all group-hover:scale-110 group-hover:rotate-12" />
                  Se Alle Spil
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>
              <motion.button 
                className="btn-secondary-cta flex items-center gap-2 group magnetic-hover"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Dagens Tilbud</span>
                <motion.span 
                  className="px-2.5 py-1 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold" 
                  animate={{ 
                    boxShadow: [
                      "0 0 8px hsl(0 85% 60% / 0.3)",
                      "0 0 20px hsl(0 85% 60% / 0.5)",
                      "0 0 8px hsl(0 85% 60% / 0.3)",
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  -70%
                </motion.span>
              </motion.button>
            </motion.div>

            {/* Guarantees */}
            <motion.div 
              className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-muted-foreground"
              variants={itemVariants}
            >
              {[
                { icon: Shield, text: "Pengene tilbage garanti" },
                { icon: Clock, text: "24/7 Dansk support" },
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
                    className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <item.icon className="w-4 h-4 text-success" />
                  </motion.div>
                  <span>{item.text}</span>
                </motion.div>
              ))}
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
                scale: 1.02,
                boxShadow: "0 40px 80px -20px hsl(0 0% 0% / 0.7), 0 0 60px hsl(142 70% 45% / 0.15)"
              }}
              transition={{ duration: 0.4 }}
            >
              {/* Urgency banner with countdown */}
              <div className="relative py-4 px-6 overflow-hidden" 
                style={{ background: 'linear-gradient(135deg, hsl(0 85% 55%), hsl(0 85% 45%))' }}>
                <motion.div 
                  className="absolute inset-0 opacity-20" 
                  style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, hsl(0 0% 0% / 0.1) 10px, hsl(0 0% 0% / 0.1) 20px)' }}
                  animate={{ x: [0, 20] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative flex items-center justify-between">
                  <motion.div 
                    className="flex items-center gap-2"
                    animate={{ x: [0, 2, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-bold text-sm tracking-wide">Ugens Bedste Tilbud</span>
                  </motion.div>
                  <div className="flex items-center gap-1.5 font-mono text-sm font-bold">
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

                    {/* Enhanced Price with pop animation */}
                    <motion.div 
                      className="mb-5 p-3 -mx-3 rounded-xl" 
                      style={{ background: 'linear-gradient(135deg, hsl(142 70% 45% / 0.08), transparent)' }}
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
                          className="px-2 py-0.5 rounded bg-success/20 text-success text-sm font-bold"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 }}
                        >
                          Du sparer 150 kr
                        </motion.span>
                      </div>
                    </motion.div>

                    {/* Animated Stock indicator */}
                    <div className="flex items-center gap-2 mb-4 text-sm">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-destructive to-destructive/70 rounded-full origin-left"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 0.3 }}
                          transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
                        />
                      </div>
                      <motion.span 
                        className="text-destructive font-medium whitespace-nowrap"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        Kun 47 tilbage!
                      </motion.span>
                    </div>

                    {/* CTA */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="success" size="lg" className="w-full group btn-primary ripple">
                        <Zap className="w-4 h-4 transition-all group-hover:scale-110 group-hover:rotate-12" />
                        Køb Nu - Levering på 30 sek
                      </Button>
                    </motion.div>

                    {/* Micro trust */}
                    <motion.div 
                      className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                    >
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        Officiel key
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-success" />
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