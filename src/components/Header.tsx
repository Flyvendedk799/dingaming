import { ShoppingCart, Search, User, Menu, X, Zap, ChevronDown, Heart } from "lucide-react";
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
      {/* Announcement bar */}
      <div className="bg-success text-success-foreground py-2.5 text-center text-sm font-medium relative overflow-hidden">
        <div className="container mx-auto px-4 flex items-center justify-center gap-2">
          <Zap className="w-4 h-4" />
          <span>
            <span className="hidden sm:inline">Gratis levering på alle ordrer • </span>
            Keys sendt på <strong>30 sekunder</strong>
          </span>
        </div>
      </div>

      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-background/98 backdrop-blur-md border-b border-border shadow-sm' 
          : 'bg-background border-b border-border'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-lg bg-success flex items-center justify-center transition-transform group-hover:scale-105">
                <Zap className="w-5 h-5 text-success-foreground" />
              </div>
              <div className="hidden sm:block">
                <span className="font-heading text-xl font-bold text-foreground">GameKeys</span>
                <span className="text-success font-bold">.dk</span>
              </div>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { label: "Alle Spil", href: "#spil" },
                { label: "Kategorier", href: "#", hasDropdown: true },
                { label: "Tilbud", href: "#", highlight: true },
                { label: "Support", href: "#" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.highlight 
                      ? 'text-destructive hover:bg-destructive/10' 
                      : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                  {item.highlight && <span className="text-xs">🔥</span>}
                  {item.hasDropdown && <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </a>
              ))}
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
                    className="w-56 lg:w-64 h-10 pl-10 pr-4 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-success focus:bg-muted transition-all"
                  />
                </div>
              </div>

              <Button variant="ghost" size="icon" className="md:hidden">
                <Search className="w-5 h-5" />
              </Button>

              <Button variant="ghost" size="icon" className="hidden sm:flex relative">
                <Heart className="w-5 h-5" />
              </Button>

              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>

              {/* Cart */}
              <Button variant="outline" className="relative gap-2 border-success/30 hover:border-success hover:bg-success/5">
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Kurv</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-success text-success-foreground text-xs rounded-full flex items-center justify-center font-bold shadow-sm">
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
            <nav className="lg:hidden py-4 border-t border-border animate-fade-in">
              <div className="flex flex-col gap-1">
                {["Alle Spil", "Kategorier", "Tilbud 🔥", "Support", "Min Konto"].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors font-medium"
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
