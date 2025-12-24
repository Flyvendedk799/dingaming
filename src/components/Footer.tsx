import { Facebook, Instagram, Twitter, Youtube, Shield, Zap, CreditCard, Mail } from "lucide-react";
import { Button } from "./ui/button";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      {/* Newsletter */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-3">
              Få eksklusive tilbud
            </h3>
            <p className="text-muted-foreground mb-6">
              Tilmeld dig og få 10% rabat på din første ordre
            </p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="email" 
                  placeholder="Din email"
                  className="w-full h-12 pl-12 pr-4 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-success"
                />
              </div>
              <Button size="lg">Tilmeld</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-success flex items-center justify-center">
                <Zap className="w-5 h-5 text-success-foreground" />
              </div>
              <span className="font-heading text-xl font-bold text-foreground">GameKeys.dk</span>
            </a>
            <p className="text-sm text-muted-foreground mb-4">
              Danmarks største udvalg af digitale game keys med øjeblikkelig levering.
            </p>
            <div className="flex items-center gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">Kategorier</h4>
            <ul className="space-y-2 text-sm">
              {["Steam Keys", "PlayStation", "Xbox", "Nintendo Switch", "Alle Spil"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">Kundeservice</h4>
            <ul className="space-y-2 text-sm">
              {["Kontakt Os", "FAQ", "Sådan Aktiverer Du", "Refundering", "Handelsbetingelser"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">Sikker Handel</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Shield className="w-8 h-8 text-success" />
                <div>
                  <div className="text-sm font-medium text-foreground">SSL Krypteret</div>
                  <div className="text-xs text-muted-foreground">100% sikker betaling</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Visa", "MC", "MobilePay", "PayPal"].map((m) => (
                  <div key={m} className="px-3 py-1.5 rounded bg-muted text-xs font-medium text-muted-foreground">
                    {m}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} GameKeys.dk. Alle rettigheder forbeholdes.</p>
          <div className="flex items-center gap-4">
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
