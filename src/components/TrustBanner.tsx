import { Shield, Zap, RefreshCw, Headphones, CreditCard, Star } from "lucide-react";

const trustPoints = [
  { icon: Zap, title: "Øjeblikkelig Levering", description: "Din key sendes automatisk til din email inden for 30 sekunder" },
  { icon: Shield, title: "100% Officielle Keys", description: "Alle keys er købt direkte fra udgivere og distributører" },
  { icon: RefreshCw, title: "Pengene Tilbage", description: "Fuld refundering inden for 14 dage hvis key ikke virker" },
  { icon: Headphones, title: "Dansk Support", description: "Vores team sidder klar til at hjælpe dig 24/7" },
];

const TrustBanner = () => {
  return (
    <section className="py-12 bg-card border-y border-border">
      <div className="container mx-auto px-4">
        {/* Trust score header */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-accent fill-accent" />
              ))}
            </div>
            <span className="text-lg font-bold text-foreground">4.9/5</span>
          </div>
          <span className="text-muted-foreground">baseret på 12.847 anmeldelser på</span>
          <span className="font-semibold text-foreground">Trustpilot</span>
        </div>

        {/* Trust points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustPoints.map((point) => (
            <div key={point.title} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-success/10 mb-4">
                <point.icon className="w-7 h-7 text-success" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                {point.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {point.description}
              </p>
            </div>
          ))}
        </div>

        {/* Payment methods - trust signals */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <span className="text-sm text-muted-foreground">Sikker betaling med:</span>
            {["Visa", "Mastercard", "MobilePay", "PayPal", "Apple Pay"].map((method) => (
              <div key={method} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{method}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustBanner;
