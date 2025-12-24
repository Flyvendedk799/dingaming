import { ShoppingCart, Search, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Header = () => {
  const [cartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon">
              <span className="font-display font-bold text-primary-foreground text-lg">GK</span>
            </div>
            <span className="font-display text-xl font-bold text-foreground hidden sm:block">
              GameKeys<span className="text-primary">.dk</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#spil" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Alle Spil
            </a>
            <a href="#kategorier" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Kategorier
            </a>
            <a href="#tilbud" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Tilbud
            </a>
            <a href="#support" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Support
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a href="#spil" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Alle Spil
              </a>
              <a href="#kategorier" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Kategorier
              </a>
              <a href="#tilbud" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Tilbud
              </a>
              <a href="#support" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Support
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
