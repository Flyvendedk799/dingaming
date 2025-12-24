import { Search, ShoppingCart, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

const steps = [
  { 
    number: "1", 
    title: "Find dit spil", 
    description: "Søg eller browse i vores katalog med over 2.800 spil",
    icon: Search
  },
  { 
    number: "2", 
    title: "Tilføj til kurv", 
    description: "Vælg dit spil og tilføj det til din indkøbskurv",
    icon: ShoppingCart
  },
  { 
    number: "3", 
    title: "Betal sikkert", 
    description: "Betal med MobilePay, kort, PayPal eller andre metoder",
    icon: CheckCircle2
  },
  { 
    number: "4", 
    title: "Modtag key", 
    description: "Din game key sendes til din email på under 30 sekunder",
    icon: Zap
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Sådan køber du et spil
          </h2>
          <p className="text-muted-foreground text-lg">
            Fra søgning til spil på under 2 minutter
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center group">
              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full">
                  <ArrowRight className="w-6 h-6 text-border" />
                </div>
              )}
              
              {/* Step number with icon */}
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/10 text-primary mb-6 relative group-hover:bg-primary/15 transition-colors">
                <step.icon className="w-10 h-10" />
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">
                  {step.number}
                </span>
              </div>
              
              <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 sm:p-12">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Klar til at spare på dine spil?
              </h3>
              <p className="text-muted-foreground text-lg">
                Opret en gratis konto og få <span className="text-primary font-semibold">10% rabat</span> på din første ordre
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button size="xl" className="whitespace-nowrap group bg-primary text-primary-foreground hover:bg-primary/90">
                Opret Gratis Konto
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <span className="text-sm text-muted-foreground">Ingen kreditkort påkrævet</span>
            </div>
          </div>
          
          {/* Decorative element */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
