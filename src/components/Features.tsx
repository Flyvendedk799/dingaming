import { Zap, Shield, CreditCard, Headphones, Globe, Gift, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

const features = [
  {
    icon: Zap,
    title: "Øjeblikkelig Levering",
    description: "Modtag din game key direkte i din email inden for sekunder efter køb.",
    color: "primary",
  },
  {
    icon: Shield,
    title: "100% Sikker",
    description: "Alle keys er ægte og garanteret at virke. Din betaling er altid sikker.",
    color: "secondary",
  },
  {
    icon: CreditCard,
    title: "Nem Betaling",
    description: "Betal med MobilePay, kort, PayPal eller andre populære betalingsmetoder.",
    color: "accent",
  },
  {
    icon: Headphones,
    title: "Dansk Support",
    description: "Vores danske kundeservice står klar til at hjælpe dig 7 dage om ugen.",
    color: "primary",
  },
  {
    icon: Globe,
    title: "Alle Platforme",
    description: "Steam, PlayStation, Xbox, Nintendo Switch – vi har keys til alle platforme.",
    color: "secondary",
  },
  {
    icon: Gift,
    title: "Giv i Gave",
    description: "Send game keys som gave direkte til dine venner og familie.",
    color: "accent",
  },
];

const getColorClasses = (color: string) => {
  switch (color) {
    case "primary":
      return {
        bg: "bg-primary/10 group-hover:bg-primary/20",
        icon: "text-primary",
        glow: "group-hover:shadow-neon",
        border: "group-hover:border-primary/50",
      };
    case "secondary":
      return {
        bg: "bg-secondary/10 group-hover:bg-secondary/20",
        icon: "text-secondary",
        glow: "group-hover:shadow-purple",
        border: "group-hover:border-secondary/50",
      };
    case "accent":
      return {
        bg: "bg-accent/10 group-hover:bg-accent/20",
        icon: "text-accent",
        glow: "group-hover:shadow-gold",
        border: "group-hover:border-accent/50",
      };
    default:
      return {
        bg: "bg-primary/10",
        icon: "text-primary",
        glow: "",
        border: "",
      };
  }
};

const Features = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-surface-elevated" />
      <div className="absolute inset-0 bg-gradient-radial opacity-30" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Hvorfor vælge <span className="text-gradient-gold glow-text-gold">GameKeys.dk</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Vi gør det nemt, hurtigt og sikkert at købe dine yndlingsspil online.
          </p>
          <div className="decoration-line max-w-md mx-auto" />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const colors = getColorClasses(feature.color);
            return (
              <div
                key={feature.title}
                className={`group relative p-8 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm transition-all duration-500 hover:transform hover:-translate-y-2 ${colors.glow} ${colors.border} animate-fade-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center mb-6 transition-all duration-300`}>
                  <feature.icon className={`w-8 h-8 ${colors.icon}`} />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-bold text-foreground mb-3 group-hover:text-gradient transition-all duration-300">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover arrow */}
                <div className="mt-4 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-2">
                  <span className="text-sm font-semibold">Læs mere</span>
                  <ArrowRight className="w-4 h-4" />
                </div>

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-tr-2xl">
                  <div className={`absolute top-0 right-0 w-2 h-20 ${colors.bg.replace('/10', '/30').replace('/20', '/50')} transform rotate-45 translate-x-4 -translate-y-4`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="inline-block p-8 rounded-3xl glass border border-border/50">
            <h3 className="font-display text-2xl font-bold text-foreground mb-4">
              Klar til at starte?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Tilmeld dig i dag og få 10% rabat på din første ordre!
            </p>
            <Button variant="hero" size="xl" className="group">
              <Zap className="w-5 h-5" />
              Opret Konto Gratis
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
