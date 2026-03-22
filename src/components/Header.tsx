import { User, Menu, X, Zap, ChevronDown, Heart, Search, Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CartDrawer } from "@/components/CartDrawer";
import SearchDropdown from "@/components/SearchDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useShardBalance } from "@/hooks/useShards";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { data: balance } = useShardBalance();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Alle Spil", href: "/#spil" },
    { label: "Kategorier", href: "/categories", hasDropdown: true },
    { label: "Tilbud", href: "/deals", highlight: true },
    { label: "Support", href: "/support" },
  ];

  const formatShards = (shards: number) => {
    if (shards >= 1000) {
      return `${(shards / 1000).toFixed(1)}k`;
    }
    return shards.toString();
  };

  return (
    <>
      {/* Announcement bar */}
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
            {/* Logo */}
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
              
              {/* Customer Club link */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -1 }}
              >
                <Link
                  to="/club"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors text-success hover:bg-success/10"
                >
                  <Sparkles className="w-4 h-4" />
                  Club
                  {user && balance?.balance ? (
                    <span className="ml-1 px-1.5 py-0.5 bg-success/20 rounded text-xs">
                      {formatShards(balance.balance)}
                    </span>
                  ) : null}
                </Link>
              </motion.div>
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
                <SearchDropdown />
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

              {/* User menu / Login */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                {authLoading ? (
                  <Button variant="ghost" size="icon" disabled>
                    <User className="w-5 h-5" />
                  </Button>
                ) : user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <User className="w-5 h-5" />
                        {balance?.balance ? (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full" />
                        ) : null}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium text-foreground">
                          {user.user_metadata?.display_name || user.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/club" className="cursor-pointer">
                          <Sparkles className="w-4 h-4 mr-2 text-success" />
                          Customer Club
                          {balance?.balance ? (
                            <span className="ml-auto text-success text-xs">
                              {formatShards(balance.balance)} Shards
                            </span>
                          ) : null}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/club/rewards" className="cursor-pointer">
                          <Heart className="w-4 h-4 mr-2" />
                          Mine Rewards
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/orders" className="cursor-pointer">
                          <Package className="w-4 h-4 mr-2" />
                          Mine Ordrer
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => signOut()}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        Log ud
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link to="/login">
                    <Button variant="ghost" size="icon">
                      <LogIn className="w-5 h-5" />
                    </Button>
                  </Link>
                )}
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

          {/* Mobile Menu */}
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
                  
                  {/* Club link in mobile */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    whileHover={{ x: 8 }}
                  >
                    <Link
                      to="/club"
                      className="flex items-center gap-2 px-4 py-3 text-success hover:bg-success/10 rounded-lg transition-colors font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Sparkles className="w-5 h-5" />
                      Customer Club
                      {user && balance?.balance ? (
                        <span className="ml-auto px-2 py-0.5 bg-success/20 rounded text-sm">
                          {formatShards(balance.balance)} Shards
                        </span>
                      ) : null}
                    </Link>
                  </motion.div>

                  {/* Auth links in mobile */}
                  {!user && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Link
                        to="/login"
                        className="flex items-center gap-2 px-4 py-3 text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LogIn className="w-5 h-5" />
                        Log ind / Opret konto
                      </Link>
                    </motion.div>
                  )}
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
