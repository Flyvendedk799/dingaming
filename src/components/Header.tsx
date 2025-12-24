import { ShoppingCart, Search, User, Menu, X, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const Header = () => {
  const [cartCount] = useState(2);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top bar - Trust message */}
      <div className="bg-success text-success-foreground py-2 text-center text-sm font-medium">
        <span className="flex items-center justify-center gap-2">
          <Zap className="w-4 h-4" />
          Gratis levering på alle ordrer • Keys sendt på 30 sekunder
        </span>
      </div>

      <header className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm' : 'bg-background border-b border-border'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-success flex items-center justify-center">
                <Zap className="w-5 h-5 text-success-foreground" />
              </div>
              <span className="font-heading text-xl font-bold text-foreground">
                GameKeys.dk
              </span>
            </a>

            {/* Desktop Navigation - Simple & Clear */}
            <nav className="hidden lg:flex items-center gap-1">
              <a href="#" className="px-4 py-2 text-sm font-medium text-foreground hover:text-success transition-colors">
                Alle Spil
              </a>
              <a href="#" className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-foreground hover:text-success transition-colors">
                Kategorier
                <ChevronDown className="w-4 h-4" />
              </a>
              <a href="#" className="px-4 py-2 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors">
                Tilbud 🔥
              </a>
              <a href="#" className="px-4 py-2 text-sm font-medium text-foreground hover:text-success transition-colors">
                Support
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text"
                    placeholder="Søg efter spil..."
                    className="w-64 h-10 pl-10 pr-4 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-success transition-colors"
                  />
                </div>
              </div>

              <Button variant="ghost" size="icon" className="md:hidden">
                <Search className="w-5 h-5" />
              </Button>

              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>

              {/* Cart - prominent */}
              <Button variant="outline" className="relative gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline">Kurv</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-success text-success-foreground text-xs rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="lg:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-2">
                {["Alle Spil", "Kategorier", "Tilbud", "Support", "Min Konto"].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
