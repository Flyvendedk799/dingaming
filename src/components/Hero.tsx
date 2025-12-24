import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, ChevronRight, Sparkles, Play } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import game1 from "@/assets/game-1.jpg";
import game2 from "@/assets/game-2.jpg";
import game3 from "@/assets/game-3.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-noise">
      {/* Multi-layer background */}
      <div className="absolute inset-0 z-0">
        {/* Base image */}
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0"
        >
          <img
            src={heroBg}
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/90" />
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 bg-glow" />
        
        {/* Animated orbs */}
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 18, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-secondary/15 blur-[100px]"
        />
        <motion.div 
          animate={{ 
            x: [0, 60, 0],
            y: [0, -60, 0],
          }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full bg-neon-magenta/10 blur-[80px]"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-32 pb-20">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left: Text Content - 7 columns */}
          <div className="lg:col-span-7 text-left">
            {/* Animated badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass border border-primary/30 mb-10 holographic"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
              </span>
              <span className="text-sm font-semibold text-foreground tracking-wide">ØJEBLIKKELIG LEVERING</span>
              <ChevronRight className="w-4 h-4 text-primary" />
            </motion.div>

            {/* Cinematic Heading */}
            <div className="overflow-hidden mb-8">
              <motion.h1 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                className="font-display text-[4rem] sm:text-[6rem] lg:text-[8rem] xl:text-[10rem] font-normal leading-[0.85] tracking-tight"
              >
                <span className="block text-foreground">DINE</span>
              </motion.h1>
            </div>
            <div className="overflow-hidden mb-8">
              <motion.h1 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.33, 1, 0.68, 1] }}
                className="font-display text-[4rem] sm:text-[6rem] lg:text-[8rem] xl:text-[10rem] font-normal leading-[0.85] tracking-tight"
              >
                <span className="text-gradient glow-text-strong">GAME</span>
              </motion.h1>
            </div>
            <div className="overflow-hidden mb-12">
              <motion.h1 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.33, 1, 0.68, 1] }}
                className="font-display text-[4rem] sm:text-[6rem] lg:text-[8rem] xl:text-[10rem] font-normal leading-[0.85] tracking-tight"
              >
                <span className="block text-foreground">KEYS</span>
              </motion.h1>
            </div>

            {/* Subtitle with accent line */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-start gap-4 mb-12 max-w-xl"
            >
              <div className="w-1 h-20 bg-gradient-to-b from-primary via-secondary to-transparent rounded-full mt-1" />
              <p className="text-xl text-muted-foreground leading-relaxed font-body">
                Danmarks hurtigste digitale spilbutik. Fra køb til spil på 
                <span className="text-primary font-semibold"> under 60 sekunder</span>. 
                Ægte keys, sikker betaling, altid.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <Button variant="hero" size="xl" className="group relative overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  UDFORSK SPIL
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
              <Button variant="outline" size="xl" className="group border-2">
                <Play className="w-5 h-5 mr-2" />
                SE HVORDAN DET VIRKER
              </Button>
            </motion.div>
          </div>

          {/* Right: Featured Games Stack - 5 columns */}
          <div className="lg:col-span-5 relative hidden lg:block h-[700px]">
            {/* Spotlight effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.2)_0%,_transparent_60%)]" />
            
            {/* Main featured card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.33, 1, 0.68, 1] }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[320px]"
            >
              <div className="card-3d group">
                <div className="card-3d-inner relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-glow-md">
                  {/* Holographic overlay */}
                  <div className="absolute inset-0 z-10 holographic opacity-50 group-hover:opacity-100 transition-opacity" />
                  
                  <img
                    src={game1}
                    alt="Featured Game"
                    className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Bottom gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                  
                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold shadow-lg">
                        -33%
                      </span>
                      <span className="px-3 py-1 rounded-full glass text-primary text-xs font-bold border border-primary/30">
                        STEAM
                      </span>
                    </div>
                    <h3 className="font-display text-2xl text-foreground mb-3">SHADOW WARRIOR</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-3xl font-bold text-gradient glow-text">299 kr</span>
                        <span className="text-muted-foreground line-through ml-2">449 kr</span>
                      </div>
                      <Button variant="hero" size="sm">
                        <Zap className="w-4 h-4" />
                        KØB
                      </Button>
                    </div>
                  </div>
                  
                  {/* Animated border glow */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-primary/50 opacity-0 group-hover:opacity-100 shadow-glow-lg transition-opacity duration-500" />
                </div>
              </div>
            </motion.div>

            {/* Secondary cards - floating behind */}
            <motion.div 
              initial={{ opacity: 0, x: -50, rotate: -15 }}
              animate={{ opacity: 0.8, x: 0, rotate: -12 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="absolute top-1/3 -left-4 z-20 float"
            >
              <div className="w-[180px] rounded-xl overflow-hidden border border-border/50 shadow-elevation">
                <img src={game2} alt="" className="w-full aspect-[3/4] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50, rotate: 15 }}
              animate={{ opacity: 0.7, x: 0, rotate: 8 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute bottom-1/4 -right-4 z-10 float-delayed"
            >
              <div className="w-[160px] rounded-xl overflow-hidden border border-border/50 shadow-elevation">
                <img src={game3} alt="" className="w-full aspect-[3/4] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              </div>
            </motion.div>

            {/* Decorative elements */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute top-10 right-10 w-32 h-32 border border-primary/20 rounded-full"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-20 left-10 w-20 h-20 border border-secondary/20 rounded-full"
            />
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Scroll</span>
          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
          >
            <div className="w-1.5 h-3 rounded-full bg-primary" />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px line-glow" />
    </section>
  );
};

export default Hero;
