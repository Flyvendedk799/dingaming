import { motion } from "framer-motion";
import { Zap, Shield, CreditCard, Headphones, Globe, Gift, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

const features = [
  { icon: Zap, title: "ØJEBLIKKELIG LEVERING", description: "Modtag din game key direkte i din email inden for sekunder efter køb.", color: "primary" },
  { icon: Shield, title: "100% SIKKER", description: "Alle keys er ægte og garanteret at virke. Din betaling er altid sikker.", color: "secondary" },
  { icon: CreditCard, title: "NEM BETALING", description: "Betal med MobilePay, kort, PayPal eller andre populære betalingsmetoder.", color: "accent" },
  { icon: Headphones, title: "DANSK SUPPORT", description: "Vores danske kundeservice står klar til at hjælpe dig 7 dage om ugen.", color: "primary" },
  { icon: Globe, title: "ALLE PLATFORME", description: "Steam, PlayStation, Xbox, Nintendo Switch – vi har keys til alle platforme.", color: "secondary" },
  { icon: Gift, title: "GIV I GAVE", description: "Send game keys som gave direkte til dine venner og familie.", color: "accent" },
];

const Features = () => {
  return (
    <section className="relative py-32 overflow-hidden bg-noise">
      {/* Background */}
      <div className="absolute inset-0 bg-surface-2" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(var(--secondary)/0.08)_0%,_transparent_60%)]" />
      
      <div className="relative container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-4 mb-8"
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-accent/50" />
            <Sparkles className="w-6 h-6 text-accent" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-accent/50" />
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-[3rem] sm:text-[5rem] lg:text-[7rem] leading-[0.9] mb-8"
          >
            <span className="text-foreground">HVORFOR </span>
            <span className="text-gradient-warm glow-text-gold">VÆLGE</span>
            <br />
            <span className="text-foreground">GAMEKEYS.DK</span>
          </motion.h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative p-8 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm h-full transition-all duration-500 hover:border-primary/30 border-animated spotlight">
                {/* Icon */}
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300
                    ${feature.color === 'primary' ? 'bg-primary/10 group-hover:shadow-glow-sm' : ''}
                    ${feature.color === 'secondary' ? 'bg-secondary/10 group-hover:shadow-glow-purple' : ''}
                    ${feature.color === 'accent' ? 'bg-accent/10 group-hover:shadow-gold' : ''}
                  `}
                >
                  <feature.icon className={`w-8 h-8
                    ${feature.color === 'primary' ? 'text-primary' : ''}
                    ${feature.color === 'secondary' ? 'text-secondary' : ''}
                    ${feature.color === 'accent' ? 'text-accent' : ''}
                  `} />
                </motion.div>

                {/* Content */}
                <h3 className="font-display text-2xl text-foreground mb-4 group-hover:text-gradient transition-all duration-300">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed font-body">
                  {feature.description}
                </p>

                {/* Hover link */}
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  className="mt-6 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <span className="text-sm font-semibold font-tech tracking-wide">LÆS MERE</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 text-center"
        >
          <div className="inline-block p-10 rounded-3xl glass border border-border/50 relative overflow-hidden">
            <div className="absolute inset-0 holographic opacity-30" />
            <div className="relative">
              <h3 className="font-display text-4xl sm:text-5xl text-foreground mb-4">
                KLAR TIL AT STARTE?
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto font-body text-lg">
                Tilmeld dig i dag og få <span className="text-accent font-bold">10% rabat</span> på din første ordre!
              </p>
              <Button variant="hero" size="xl" className="font-tech tracking-wider">
                <Zap className="w-5 h-5 mr-2" />
                OPRET KONTO GRATIS
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
