import { Shield, Zap, RefreshCw, Headphones, Star, Users, ShoppingBag, Clock } from "lucide-react";

const stats = [
  { icon: Users, value: "50.000+", label: "Kunder" },
  { icon: ShoppingBag, value: "200K+", label: "Solgte keys" },
  { icon: Star, value: "4.9/5", label: "Trustpilot" },
  { icon: Clock, value: "<30 sek", label: "Levering" },
];

const trustPoints = [
  { icon: Zap, title: "Øjeblikkelig Levering", description: "Key sendes automatisk til din email inden for 30 sekunder efter køb" },
  { icon: Shield, title: "100% Officielle Keys", description: "Alle keys er købt direkte fra udgivere og autoriserede distributører" },
  { icon: RefreshCw, title: "Pengene Tilbage Garanti", description: "Fuld refundering inden for 14 dage hvis din key ikke virker" },
  { icon: Headphones, title: "Dansk Kundeservice", description: "Vores danske support team er klar til at hjælpe dig 24/7" },
];

const TrustBanner = () => {
  return (
    <section className="py-16 bg-card border-y border-border">
      <div className="container mx-auto px-4">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className="text-center p-6 rounded-xl bg-muted/50 border border-border hover:border-success/30 transition-colors group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-success/10 mb-4 group-hover:bg-success/20 transition-colors">
                <stat.icon className="w-6 h-6 text-success" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trustpilot highlight */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 p-6 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-accent fill-accent" />
              ))}
            </div>
            <span className="text-2xl font-bold text-foreground">4.9/5</span>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <span className="text-muted-foreground">baseret på <span className="text-foreground font-semibold">12.847 anmeldelser</span> på Trustpilot</span>
        </div>

        {/* Trust points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPoints.map((point) => (
            <div 
              key={point.title} 
              className="p-6 rounded-xl bg-background border border-border hover:border-success/30 hover:shadow-soft transition-all duration-300 group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-success/10 mb-4 group-hover:bg-success/15 transition-colors">
                <point.icon className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                {point.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBanner;
