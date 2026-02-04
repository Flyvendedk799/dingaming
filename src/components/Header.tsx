import { Search, User, Menu, X, Zap, ChevronDown, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CartDrawer } from "@/components/CartDrawer";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    setIsLoaded(true);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const navItems = [
    { label: "Alle Spil", href: "/#spil" },
    { label: "Kategorier", href: "/categories", hasDropdown: true },
    { label: "Tilbud", href: "/deals", highlight: true },
    { label: "Support", href: "/support" },
  ];

  return (
    <>
      {/* Announcement bar - refined and elegant */}
      <motion.div 
        className="bg-primary text-primary-foreground py-2.5 text-center text-sm font-medium relative overflow-hidden"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="container mx-auto px-4 flex items-center justify-center gap-2 relative">
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
            {/* Logo - elegant typography */}
            <Link 
              to="/" 
              className="flex items-center gap-3 group"
            >
              <motion.div 
                className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center"
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.4 }}
              >
                <Zap className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <div className="hidden sm:block">
                <span className="font-heading text-xl text-foreground tracking-tight">Din</span>
                <span className="font-heading text-xl text-primary tracking-tight">Gaming</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  whileHover={{ y: -1 }}
                >
                  <Link
                    to={item.href}
                    className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                      item.highlight 
                        ? 'text-accent hover:bg-accent/10' 
                        : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {item.label}
                    {item.hasDropdown && <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </Link>
                </motion.div>
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
                <form onSubmit={handleSearch} className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-success" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Søg efter spil..."
                    className="w-56 lg:w-64 h-10 pl-10 pr-4 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-muted transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </form>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Link to="/search">
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Search className="w-5 h-5" />
                  </Button>
                </Link>
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

              {/* Cart */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <CartDrawer />
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
                  {[
                    { label: "Alle Spil", href: "/#spil" },
                    { label: "Kategorier", href: "/categories" },
                    { label: "Tilbud 🔥", href: "/deals" },
                    { label: "Support", href: "/support" },
                    { label: "Søg", href: "/search" },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 8 }}
                    >
                      <Link
                        to={item.href}
                        className="block px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
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