import { Zap, HelpCircle, FileText, Mail, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

const HowItWorks = () => {
  const steps = [
    { number: "1", title: "Vælg dit spil", description: "Find spillet du vil have fra vores katalog" },
    { number: "2", title: "Betal sikkert", description: "Betal med MobilePay, kort eller PayPal" },
    { number: "3", title: "Modtag key", description: "Din game key sendes til din email på 30 sek" },
    { number: "4", title: "Aktiver & spil", description: "Aktiver key på Steam/PSN/Xbox og start med at spille" },
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
            Sådan virker det
          </h2>
          <p className="text-muted-foreground">
            Fra køb til spil på under 2 minutter
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-full h-px bg-border" />
              )}
              
              {/* Step number */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success text-success-foreground text-2xl font-bold mb-4 relative z-10">
                {step.number}
              </div>
              
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* FAQ quick links */}
        <div className="bg-card rounded-xl border border-border p-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  Har du spørgsmål?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Se vores FAQ eller kontakt vores danske support team
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <FileText className="w-4 h-4" />
                Læs FAQ
              </Button>
              <Button>
                <Mail className="w-4 h-4" />
                Kontakt Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
