import { Button } from "@/components/ui/button";
import { Zap, Shield, Clock } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Gaming baggrund"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8 animate-pulse-slow">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">100% Digitale Game Keys</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-foreground">Få dine </span>
            <span className="text-gradient glow-text">Game Keys</span>
            <br />
            <span className="text-foreground">på sekunder</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Danmarks hurtigste digitale spilbutik. Køb game keys til Steam, PlayStation, Xbox og mere 
            – leveret direkte til din email øjeblikkeligt.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button variant="hero" size="xl" className="w-full sm:w-auto">
              <Zap className="w-5 h-5" />
              Udforsk Spil
            </Button>
            <Button variant="outline" size="xl" className="w-full sm:w-auto">
              Se Tilbud
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
              <Clock className="w-6 h-6 text-primary" />
              <span className="font-medium text-foreground">Øjeblikkelig Levering</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-medium text-foreground">100% Sikker Betaling</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
              <Zap className="w-6 h-6 text-primary" />
              <span className="font-medium text-foreground">Ægte Game Keys</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default Hero;
