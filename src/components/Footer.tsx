import { motion } from "framer-motion";
import { Facebook, Instagram, Twitter, Youtube, Shield, Zap, ArrowUp, Mail } from "lucide-react";
import { Button } from "./ui/button";

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative bg-card border-t border-border overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-mesh opacity-30" />

      {/* Newsletter Section */}
      <div className="relative border-b border-border">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h3 className="font-display text-3xl sm:text-4xl text-foreground mb-4">
              FÅ EKSKLUSIVE TILBUD
            </h3>
            <p className="text-muted-foreground mb-8 font-body">
              Tilmeld dig vores nyhedsbrev og modtag de bedste deals direkte i din inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="relative flex-1 max-w-md">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="email" 
                  placeholder="Din email adresse"
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <Button variant="hero" size="xl" className="font-tech">
                TILMELD
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <a href="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-sm">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display text-2xl text-foreground block leading-none">GAMEKEYS</span>
                <span className="text-[10px] text-primary font-tech tracking-[0.3em]">.DK</span>
              </div>
            </a>
            <p className="text-muted-foreground mb-6 font-body leading-relaxed">
              Danmarks førende online butik for digitale game keys. 
              Hurtig levering, sikker betaling.
            </p>
            <div className="flex items-center gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, index) => (
                <motion.a
                  key={index}
                  href="#"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: "HURTIGE LINKS", links: ["Alle Spil", "Tilbud", "Nye Udgivelser", "Gavekort"] },
            { title: "SUPPORT", links: ["Kontakt Os", "FAQ", "Aktiveringsguide", "Refundering"] },
          ].map((section) => (
            <div key={section.title}>
              <h3 className="font-display text-lg text-foreground mb-6 tracking-wide">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-body link-glow">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Security */}
          <div>
            <h3 className="font-display text-lg text-foreground mb-6 tracking-wide">SIKKER BETALING</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {["Visa", "MasterCard", "MobilePay", "PayPal"].map((method) => (
                <div key={method} className="px-3 py-2 rounded-lg bg-muted border border-border text-xs font-tech text-muted-foreground">
                  {method.toUpperCase()}
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl glass border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm font-tech">SSL KRYPTERET</p>
                  <p className="text-xs text-muted-foreground">100% sikre transaktioner</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground font-body">
            © {new Date().getFullYear()} GameKeys.dk. Alle rettigheder forbeholdes.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-body">Privatlivspolitik</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-body">Cookies</a>
          </div>
        </div>
      </div>

      {/* Scroll to top */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <Button
          variant="outline"
          size="icon"
          onClick={scrollToTop}
          className="rounded-full shadow-glow-sm hover:shadow-glow-md border-2"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      </motion.div>
    </footer>
  );
};

export default Footer;
