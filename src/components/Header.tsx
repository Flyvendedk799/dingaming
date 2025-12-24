import { motion } from "framer-motion";
import { ShoppingCart, Search, User, Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const Header = () => {
  const [cartCount] = useState(2);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-background/80 backdrop-blur-2xl border-b border-border/50 shadow-elevation' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="relative"
            >
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-all duration-300">
                <Zap className="w-6 h-6 lg:w-7 lg:h-7 text-primary-foreground" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-secondary blur-xl opacity-50 group-hover:opacity-75 transition-opacity -z-10" />
            </motion.div>
            <div className="hidden sm:block">
              <span className="font-display text-2xl lg:text-3xl text-foreground block leading-none tracking-wide">
                GAMEKEYS
              </span>
              <span className="text-[10px] text-primary font-tech tracking-[0.3em]">.DK</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: "ALLE SPIL", href: "#spil" },
              { label: "TILBUD", href: "#tilbud", badge: "HOT" },
              { label: "PLATFORME", href: "#platforme" },
              { label: "SUPPORT", href: "#support" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="relative px-5 py-3 text-muted-foreground hover:text-foreground transition-colors font-tech text-xs tracking-wider link-glow"
              >
                {item.label}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-foreground">
              <User className="w-5 h-5" />
            </Button>
            
            {/* Cart */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="icon" className="relative border-2 pulse-ring">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold shadow-glow-sm"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Button>
            </motion.div>

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
          <motion.nav 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden py-6 border-t border-border"
          >
            <div className="flex flex-col gap-4">
              {["ALLE SPIL", "TILBUD", "PLATFORME", "SUPPORT", "LOG IND"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-lg text-muted-foreground hover:text-primary transition-colors font-tech tracking-wider py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </div>
    </motion.header>
  );
};

export default Header;
