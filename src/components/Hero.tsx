import { Button } from "@/components/ui/button";
import { Zap, Shield, Star, ChevronRight, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import game1 from "@/assets/game-1.jpg";
import { useState, useEffect } from "react";

const Hero = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 32 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/98 to-background/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="stagger-children">
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <div className="trust-badge">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Officielle Keys
              </div>
              <div className="trust-badge">
                <Zap className="w-3.5 h-3.5" />
                30 sek levering
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'hsl(45 100% 51% / 0.1)', color: 'hsl(45 100% 51%)', border: '1px solid hsl(45 100% 51% / 0.2)' }}>
                <Star className="w-3.5 h-3.5 fill-current" />
                4.9 Trustpilot
              </div>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 leading-[1.05] text-balance">
              Køb Game Keys.
              <br />
              <span className="text-gradient-success">Spar op til 70%.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Danmarks største udvalg af digitale game keys. 
              Leveret til din email <span className="text-success font-medium">øjeblikkeligt</span>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
              <Button variant="success" size="xl" className="group text-base">
                <Zap className="w-5 h-5 transition-transform group-hover:scale-110" />
                Se Alle Spil
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="xl" className="text-base group">
                Dagens Tilbud
                <span className="ml-2 px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-xs font-bold animate-pulse">
                  -70%
                </span>
              </Button>
            </div>

            {/* Guarantees */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2.5 hover:text-foreground transition-colors cursor-default">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-success" />
                </div>
                <span>Pengene tilbage garanti</span>
              </div>
              <div className="flex items-center gap-2.5 hover:text-foreground transition-colors cursor-default">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-success" />
                </div>
                <span>24/7 Dansk support</span>
              </div>
            </div>
          </div>

          {/* Right: Featured Deal Card */}
          <div className="hidden lg:block animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="relative bg-card rounded-2xl border border-border overflow-hidden shadow-elevated">
              {/* Urgency banner with countdown */}
              <div className="bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground py-3 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold text-sm">Ugens Bedste Tilbud</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-sm font-bold">
                    <span className="bg-background/20 px-2 py-1 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span>:</span>
                    <span className="bg-background/20 px-2 py-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span>:</span>
                    <span className="bg-background/20 px-2 py-1 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex gap-6">
                  {/* Game image */}
                  <div className="w-36 flex-shrink-0">
                    <div className="relative rounded-xl overflow-hidden">
                      <img 
                        src={game1} 
                        alt="Shadow Warrior" 
                        className="w-full aspect-[3/4] object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-1 rounded bg-destructive text-destructive-foreground text-xs font-bold">
                        -33%
                      </div>
                    </div>
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

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-success">299 kr</span>
                        <span className="text-lg text-muted-foreground line-through">449 kr</span>
                      </div>
                      <span className="text-sm font-medium text-destructive">Du sparer 150 kr</span>
                    </div>

                    {/* Stock indicator */}
                    <div className="flex items-center gap-2 mb-4 text-sm">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-[30%] bg-gradient-to-r from-destructive to-destructive/70 rounded-full" />
                      </div>
                      <span className="text-destructive font-medium whitespace-nowrap">Kun 47 tilbage!</span>
                    </div>

                    {/* CTA */}
                    <Button variant="success" size="lg" className="w-full group">
                      <Zap className="w-4 h-4 transition-transform group-hover:scale-110" />
                      Køb Nu - Levering på 30 sek
                    </Button>

                    {/* Micro trust */}
                    <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        Officiel key
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-success" />
                        Garanti
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social proof under card */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                    {['MK', 'SL', 'JH', 'AK'][i]}
                  </div>
                ))}
              </div>
              <span>+127 har købt dette spil i dag</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
