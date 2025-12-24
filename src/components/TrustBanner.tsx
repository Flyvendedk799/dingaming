import { Star, Users, ShoppingBag, Clock } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "50.000+",
    label: "Tilfredse Kunder",
  },
  {
    icon: ShoppingBag,
    value: "200.000+",
    label: "Solgte Keys",
  },
  {
    icon: Star,
    value: "4.9/5",
    label: "Trustpilot",
  },
  {
    icon: Clock,
    value: "<60 sek",
    label: "Gns. Leveringstid",
  },
];

const TrustBanner = () => {
  return (
    <section className="relative py-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10" />
      <div className="absolute inset-0 glass-strong" />
      
      {/* Animated border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="relative container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                <stat.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="font-display text-3xl sm:text-4xl font-bold text-gradient mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBanner;
