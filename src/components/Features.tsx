import { Zap, Shield, CreditCard, Headphones, Globe, Gift } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Øjeblikkelig Levering",
    description: "Modtag din game key direkte i din email inden for sekunder efter køb.",
  },
  {
    icon: Shield,
    title: "100% Sikker",
    description: "Alle keys er ægte og garanteret at virke. Din betaling er altid sikker.",
  },
  {
    icon: CreditCard,
    title: "Nem Betaling",
    description: "Betal med MobilePay, kort, PayPal eller andre populære betalingsmetoder.",
  },
  {
    icon: Headphones,
    title: "Dansk Support",
    description: "Vores danske kundeservice står klar til at hjælpe dig 7 dage om ugen.",
  },
  {
    icon: Globe,
    title: "Alle Platforme",
    description: "Steam, PlayStation, Xbox, Nintendo Switch – vi har keys til alle platforme.",
  },
  {
    icon: Gift,
    title: "Giv i Gave",
    description: "Send game keys som gave direkte til dine venner og familie.",
  },
];

const Features = () => {
  return (
    <section className="py-20 bg-surface-elevated">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Hvorfor vælge <span className="text-gradient">GameKeys.dk</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Vi gør det nemt og sikkert at købe dine yndlingsspil online.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-neon"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
