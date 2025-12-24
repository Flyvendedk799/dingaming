import { Facebook, Instagram, Twitter, Youtube, CreditCard, Shield, Zap, ArrowUp } from "lucide-react";
import { Button } from "./ui/button";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-card border-t border-border overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display text-xl font-bold text-foreground block leading-tight">
                  GameKeys
                </span>
                <span className="text-xs text-primary font-semibold tracking-wider">.DK</span>
              </div>
            </a>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Danmarks førende online butik for digitale game keys. 
              Hurtig levering, sikker betaling og ægte keys garanteret.
            </p>
            <div className="flex items-center gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-bold text-foreground mb-6 text-lg">Hurtige Links</h3>
            <ul className="space-y-3">
              {["Alle Spil", "Tilbud", "Nye Udgivelser", "Forudbestillinger", "Gavekort"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-display font-bold text-foreground mb-6 text-lg">Support</h3>
            <ul className="space-y-3">
              {["Kontakt Os", "FAQ", "Aktiveringsguide", "Refunderingspolitik", "Handelsbetingelser"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment & Security */}
          <div>
            <h3 className="font-display font-bold text-foreground mb-6 text-lg">Sikker Betaling</h3>
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {["Visa", "MasterCard", "MobilePay", "PayPal"].map((method) => (
                <div key={method} className="px-3 py-2 rounded-lg bg-muted border border-border">
                  <span className="text-xs font-semibold text-muted-foreground">{method}</span>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl glass border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">SSL Krypteret</p>
                  <p className="text-xs text-muted-foreground">100% sikre transaktioner</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} GameKeys.dk. Alle rettigheder forbeholdes.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Privatlivspolitik
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Cookiepolitik
            </a>
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      <Button
        variant="outline"
        size="icon"
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 z-50 rounded-full shadow-neon hover:shadow-neon-strong"
      >
        <ArrowUp className="w-5 h-5" />
      </Button>
    </footer>
  );
};

export default Footer;
