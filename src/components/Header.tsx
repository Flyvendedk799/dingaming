import { ShoppingCart, Search, User, Menu, X, Zap, ChevronDown, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const [cartCount] = useState(2);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    setIsLoaded(true);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Announcement bar with slide-in animation */}
      <motion.div 
        className="bg-success text-success-foreground py-2.5 text-center text-sm font-medium relative overflow-hidden"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Animated shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
        />
        <div className="container mx-auto px-4 flex items-center justify-center gap-2 relative">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
          >
            <Zap className="w-4 h-4" />
          </motion.div>
          <span>
            <span className="hidden sm:inline">Gratis levering på alle ordrer • </span>
            Keys sendt på <strong>30 sekunder</strong>
          </span>
        </div>
      </motion.div>

      <motion.header 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-background/98 backdrop-blur-md border-b border-border shadow-sm' 
            : 'bg-background border-b border-border'
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <motion.a 
              href="/" 
              className="flex items-center gap-2.5 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div 
                className="w-10 h-10 rounded-lg bg-success flex items-center justify-center"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.4 }}
              >
                <Zap className="w-5 h-5 text-success-foreground" />
              </motion.div>
              <div className="hidden sm:block">
                <span className="font-heading text-xl font-bold text-foreground">GameKeys</span>
                <span className="text-success font-bold">.dk</span>
              </div>
            </motion.a>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { label: "Alle Spil", href: "#spil" },
                { label: "Kategorier", href: "#", hasDropdown: true },
                { label: "Tilbud", href: "#", highlight: true },
                { label: "Support", href: "#" },
              ].map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                    item.highlight 
                      ? 'text-destructive hover:bg-destructive/10' 
                      : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  {item.label}
                  {item.highlight && (
                    <motion.span 
                      className="text-xs"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      🔥
                    </motion.span>
                  )}
                  {item.hasDropdown && <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </motion.a>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <motion.div 
                className="hidden md:flex items-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-success" />
                  <input 
                    type="text"
                    placeholder="Søg efter spil..."
                    className="w-56 lg:w-64 h-10 pl-10 pr-4 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-success focus:bg-muted transition-all focus:ring-2 focus:ring-success/20"
                  />
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Search className="w-5 h-5" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="hidden sm:flex relative">
                  <Heart className="w-5 h-5" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </motion.div>

              {/* Cart with attention-grabbing animation */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="outline" className="relative gap-2 border-success/30 hover:border-success hover:bg-success/5 group">
                  <motion.div
                    whileHover={{ rotate: [-5, 5, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </motion.div>
                  <span className="hidden sm:inline font-medium">Kurv</span>
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span 
                        className="absolute -top-2 -right-2 w-5 h-5 bg-success text-success-foreground text-xs rounded-full flex items-center justify-center font-bold shadow-sm"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <AnimatePresence mode="wait">
                    {mobileMenuOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Menu className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Mobile Menu with slide animation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.nav 
                className="lg:hidden py-4 border-t border-border overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex flex-col gap-1">
                  {["Alle Spil", "Kategorier", "Tilbud 🔥", "Support", "Min Konto"].map((item, index) => (
                    <motion.a
                      key={item}
                      href="#"
                      className="px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 8 }}
                    >
                      {item}
                    </motion.a>
                  ))}
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </motion.header>
    </>
  );
};

export default Header;