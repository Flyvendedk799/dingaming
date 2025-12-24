import { ShoppingCart, Search, User, Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const Header = () => {
  const [cartCount] = useState(2);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-background/90 backdrop-blur-xl border-b border-border shadow-lg' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon group-hover:shadow-neon-strong transition-all duration-300">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="absolute inset-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-xl font-bold text-foreground block leading-tight">
                GameKeys
              </span>
              <span className="text-xs text-primary font-semibold tracking-wider">.DK</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: "Alle Spil", href: "#spil" },
              { label: "Tilbud", href: "#tilbud", badge: "HOT" },
              { label: "Platforme", href: "#platforme" },
              { label: "Support", href: "#support" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="relative px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-medium group"
              >
                {item.label}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-foreground hover:bg-muted">
              <User className="w-5 h-5" />
            </Button>
            
            {/* Cart Button */}
            <Button variant="outline" size="icon" className="relative group">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold shadow-neon animate-pulse-slow">
                  {cartCount}
                </span>
              )}
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-6 border-t border-border animate-fade-up">
            <div className="flex flex-col gap-4">
              {[
                { label: "Alle Spil", href: "#spil" },
                { label: "Tilbud", href: "#tilbud" },
                { label: "Platforme", href: "#platforme" },
                { label: "Support", href: "#support" },
                { label: "Log Ind", href: "#login" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-lg text-muted-foreground hover:text-primary transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
