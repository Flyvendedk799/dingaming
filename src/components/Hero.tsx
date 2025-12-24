import { Button } from "@/components/ui/button";
import { Zap, Shield, Clock, ChevronRight, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import game1 from "@/assets/game-1.jpg";
import game2 from "@/assets/game-2.jpg";
import game3 from "@/assets/game-3.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Gaming baggrund"
          className="w-full h-full object-cover scale-105 animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/70" />
        
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial opacity-50" />
        
        {/* Animated particles/dots effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-primary/60 animate-float shadow-neon" style={{ animationDelay: '0s' }} />
          <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-secondary/60 animate-float shadow-purple" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-accent/60 animate-float shadow-gold" style={{ animationDelay: '2s' }} />
          <div className="absolute top-2/3 right-1/4 w-4 h-4 rounded-full bg-primary/40 animate-float shadow-neon" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>

      {/* Decorative grid pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-primary/30 mb-8 animate-glow">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-gradient">100% Digitale Game Keys</span>
              <ChevronRight className="w-4 h-4 text-primary" />
            </div>

            {/* Heading */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-[1.1]">
              <span className="text-foreground block animate-fade-up" style={{ animationDelay: '0.1s' }}>
                Dine spil.
              </span>
              <span className="text-gradient glow-text block animate-fade-up" style={{ animationDelay: '0.2s' }}>
                Øjeblikkeligt.
              </span>
              <span className="text-foreground block animate-fade-up" style={{ animationDelay: '0.3s' }}>
                Altid billigst.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed animate-fade-up" style={{ animationDelay: '0.4s' }}>
              Oplev den hurtigste måde at købe game keys i Danmark. 
              Fra køb til spil på <span className="text-primary font-semibold">under 60 sekunder</span>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-12 animate-fade-up" style={{ animationDelay: '0.5s' }}>
              <Button variant="hero" size="xl" className="group">
                <Zap className="w-5 h-5 group-hover:animate-pulse" />
                Udforsk Spil
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="xl" className="group">
                Se Dagens Tilbud
                <span className="ml-2 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">-70%</span>
              </Button>
            </div>

            {/* Features */}
            <div className="flex flex-wrap items-center gap-6 animate-fade-up" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">60 sek levering</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">100% Sikker</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <span className="text-sm font-medium text-foreground">Ægte Keys</span>
              </div>
            </div>
          </div>

          {/* Right: Featured Games Visual */}
          <div className="relative hidden lg:block">
            {/* Main featured game */}
            <div className="relative z-20 animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="relative rounded-2xl overflow-hidden shadow-card border border-border group game-card-hover">
                <img
                  src={game1}
                  alt="Featured Game"
                  className="w-full aspect-[3/4] object-cover card-image transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                
                {/* Overlay content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">-33%</span>
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">Steam</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground mb-2">Shadow Warrior: Legends</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">299 kr</span>
                      <span className="text-lg text-muted-foreground line-through">449 kr</span>
                    </div>
                    <Button variant="hero" size="lg">
                      <Zap className="w-4 h-4" />
                      Køb Nu
                    </Button>
                  </div>
                </div>

                {/* Glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 shadow-neon-strong rounded-2xl" />
                </div>
              </div>
            </div>

            {/* Floating secondary games */}
            <div className="absolute -left-16 top-1/4 z-10 animate-float" style={{ animationDelay: '0s' }}>
              <div className="w-32 h-44 rounded-xl overflow-hidden shadow-card border border-border/50 rotate-[-8deg] hover:rotate-0 transition-transform duration-500">
                <img src={game2} alt="Game" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
            </div>

            <div className="absolute -right-8 bottom-1/4 z-10 animate-float" style={{ animationDelay: '1s' }}>
              <div className="w-28 h-40 rounded-xl overflow-hidden shadow-card border border-border/50 rotate-[12deg] hover:rotate-0 transition-transform duration-500">
                <img src={game3} alt="Game" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-8 -right-8 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </section>
  );
};

export default Hero;
