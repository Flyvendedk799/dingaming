import { Facebook, Instagram, Twitter, Youtube, CreditCard, Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <a href="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon">
                <span className="font-display font-bold text-primary-foreground text-lg">GK</span>
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                GameKeys<span className="text-primary">.dk</span>
              </span>
            </a>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Danmarks førende online butik for digitale game keys. 
              Hurtig levering, sikker betaling og ægte keys garanteret.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-bold text-foreground mb-6">Hurtige Links</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Alle Spil
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Tilbud
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Nye Udgivelser
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Forudbestillinger
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Gavekort
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-display font-bold text-foreground mb-6">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Kontakt Os
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Sådan Aktiverer Du Din Key
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Refunderingspolitik
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Handelsbetingelser
                </a>
              </li>
            </ul>
          </div>

          {/* Payment & Security */}
          <div>
            <h3 className="font-display font-bold text-foreground mb-6">Sikker Betaling</h3>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="px-3 py-2 rounded-lg bg-muted flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="px-3 py-2 rounded-lg bg-muted">
                <span className="text-sm font-semibold text-muted-foreground">MobilePay</span>
              </div>
              <div className="px-3 py-2 rounded-lg bg-muted">
                <span className="text-sm font-semibold text-muted-foreground">PayPal</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <p className="font-semibold text-foreground text-sm">SSL Krypteret</p>
                <p className="text-xs text-muted-foreground">100% sikre transaktioner</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
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
    </footer>
  );
};

export default Footer;
