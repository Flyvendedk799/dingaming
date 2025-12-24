import { Facebook, Instagram, Twitter, Youtube, Shield, Zap, CreditCard, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      {/* Newsletter */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-14">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Få eksklusive tilbud først
            </h3>
            <p className="text-muted-foreground mb-8">
              Tilmeld dig og få <span className="text-success font-semibold">10% rabat</span> på din første ordre + ugentlige deals
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="email" 
                  placeholder="Din email adresse"
                  className="w-full h-12 pl-12 pr-4 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-success transition-colors"
                />
              </div>
              <Button variant="success" size="lg" className="group">
                Tilmeld
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ingen spam. Afmeld når som helst.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <a href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-lg bg-success flex items-center justify-center">
                <Zap className="w-5 h-5 text-success-foreground" />
              </div>
              <div>
                <span className="font-heading text-xl font-bold text-foreground">GameKeys</span>
                <span className="text-success font-bold">.dk</span>
              </div>
            </a>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Danmarks største udvalg af digitale game keys med øjeblikkelig levering og dansk support.
            </p>
            <div className="flex items-center gap-2">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a 
                  key={i} 
                  href="#" 
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-5">Spil</h4>
            <ul className="space-y-3 text-sm">
              {["Alle Spil", "Steam Keys", "PlayStation", "Xbox", "Nintendo Switch", "PC Games"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground hover:text-success transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-foreground mb-5">Hjælp</h4>
            <ul className="space-y-3 text-sm">
              {["Kontakt Os", "FAQ", "Aktiveringsguide", "Refundering", "Handelsbetingelser", "Privatlivspolitik"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground hover:text-success transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-5">Sikker Handel</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                <Shield className="w-10 h-10 text-success" />
                <div>
                  <div className="font-medium text-foreground">SSL Krypteret</div>
                  <div className="text-xs text-muted-foreground">100% sikker betaling</div>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-3">Betalingsmetoder:</p>
                <div className="flex flex-wrap gap-2">
                  {["Visa", "MC", "MobilePay", "PayPal", "Apple Pay"].map((m) => (
                    <div key={m} className="px-3 py-1.5 rounded-lg bg-muted border border-border text-xs font-medium text-muted-foreground">
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} GameKeys.dk. Alle rettigheder forbeholdes.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privatlivspolitik</a>
            <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
            <a href="#" className="hover:text-foreground transition-colors">Vilkår</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
