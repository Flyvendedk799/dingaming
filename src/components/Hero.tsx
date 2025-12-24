import { Button } from "@/components/ui/button";
import { Zap, Shield, Clock, Star, ChevronRight, CheckCircle2 } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import game1 from "@/assets/game-1.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden pt-20">
      {/* Clean background */}
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Value Proposition */}
          <div>
            {/* Trust bar - ABOVE FOLD */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <div className="trust-badge">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Officielle Keys
              </div>
              <div className="trust-badge">
                <Zap className="w-3.5 h-3.5" />
                Levering på 30 sek
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                <span className="text-xs font-semibold text-accent">4.9/5 Trustpilot</span>
              </div>
            </div>

            {/* Clear headline */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-[1.1]">
              Køb Game Keys.
              <br />
              <span className="text-success">Spar op til 70%.</span>
            </h1>

            {/* Clear value props */}
            <p className="text-xl text-muted-foreground mb-8 max-w-lg">
              Danmarks største udvalg af digitale game keys til Steam, PlayStation, Xbox og Nintendo. Leveret til din email øjeblikkeligt.
            </p>

            {/* Single clear CTA */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
              <Button size="xl" className="text-base font-semibold">
                Se Alle Spil
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="xl" className="text-base">
                Dagens Tilbud
                <span className="ml-2 px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-xs font-bold">
                  -70%
                </span>
              </Button>
            </div>

            {/* Trust guarantees */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-success" />
                <span>Pengene tilbage garanti</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-success" />
                <span>24/7 Dansk support</span>
              </div>
            </div>
          </div>

          {/* Right: Featured Deal - SHOWS VALUE */}
          <div className="hidden lg:block">
            <div className="relative bg-card rounded-2xl border border-border p-6 shadow-elevated">
              {/* Urgency banner */}
              <div className="absolute -top-3 left-6 right-6">
                <div className="bg-destructive text-destructive-foreground text-center py-2 px-4 rounded-lg text-sm font-semibold">
                  🔥 Ugens Bedste Tilbud - Kun 47 keys tilbage!
                </div>
              </div>

              <div className="flex gap-6 mt-6">
                {/* Game image */}
                <div className="w-40 flex-shrink-0">
                  <img 
                    src={game1} 
                    alt="Shadow Warrior" 
                    className="w-full aspect-[3/4] object-cover rounded-xl"
                  />
                </div>

                {/* Game info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded bg-muted text-xs font-medium text-muted-foreground">Steam</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                      <span className="text-xs text-muted-foreground">4.8 (2.4k anmeldelser)</span>
                    </div>
                  </div>

                  <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                    Shadow Warrior: Legends
                  </h3>

                  {/* Price - PROMINENT */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-3">
                      <span className="price-main">299 kr</span>
                      <span className="price-original">449 kr</span>
                    </div>
                    <span className="price-save">Du sparer 150 kr (33%)</span>
                  </div>

                  {/* Single CTA */}
                  <Button className="w-full text-base font-semibold" size="lg">
                    <Zap className="w-4 h-4" />
                    Køb Nu - Levering på 30 sek
                  </Button>

                  {/* Micro trust */}
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
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
        </div>
      </div>
    </section>
  );
};

export default Hero;
