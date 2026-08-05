import { User, Menu, X, Search, Sparkles, LogIn, Package, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CartDrawer } from "@/components/CartDrawer";
import SearchDropdown from "@/components/SearchDropdown";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useShardBalance } from "@/hooks/useShards";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { label: "Alle spil", href: "/search" },
  { label: "Kategorier", href: "/categories" },
  { label: "Tilbud", href: "/deals" },
  { label: "Support", href: "/support" },
];

/** One delivery promise, used verbatim everywhere. */
export const DELIVERY_PROMISE = "Nøgle på e-mail inden for 60 sekunder";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { data: balance } = useShardBalance();

  const shards = balance?.balance ?? 0;

  return (
    <>
      {/* Utility strip. Replaces the lime announcement bar, which promised
          "free delivery" on a digital key and a second, different delivery
          time from the one used on the product page. */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-2.5 text-[13px] text-muted-foreground">
          <div className="flex gap-6 overflow-hidden whitespace-nowrap">
            <span>{DELIVERY_PROMISE}</span>
            <span className="hidden md:inline">Officielle forhandlere</span>
            <span className="hidden lg:inline">Dansk support, svar inden 24 timer</span>
          </div>
          <span className="num hidden shrink-0 text-muted-foreground/70 sm:inline">CVR 00000000</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-6 lg:h-[72px] lg:gap-10">
            <Link to="/" className="flex-none" aria-label="WGaming forside">
              <Logo size={32} />
            </Link>

            <nav className="hidden items-center gap-6 lg:flex">
              {NAV.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.href}
                  className={({ isActive }) =>
                    `border-b-2 pb-1 text-[15px] font-medium transition-colors duration-fast ${
                      isActive
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {/* Amber is the club's colour and only the club's. */}
              <NavLink
                to="/club"
                className="flex items-center gap-1.5 border-b-2 border-transparent pb-1 text-[15px] font-medium text-club transition-colors duration-fast hover:text-club/80"
              >
                <Sparkles className="h-4 w-4" />
                Klub
                {user && shards > 0 ? (
                  <span className="num rounded bg-club/15 px-1.5 py-0.5 text-xs text-club">
                    {shards.toLocaleString("da-DK")}
                  </span>
                ) : null}
              </NavLink>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden md:flex md:w-[280px] lg:w-[340px]">
                <SearchDropdown />
              </div>

              <Link to="/search" className="md:hidden">
                <Button variant="ghost" size="icon" aria-label="Søg">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>

              {authLoading ? (
                <Button variant="ghost" size="icon" disabled>
                  <User className="h-5 w-5" />
                </Button>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Din konto">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-foreground">
                        {user.user_metadata?.display_name || user.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        Mine ordrer
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/club" className="cursor-pointer">
                        <Sparkles className="mr-2 h-4 w-4 text-club" />
                        Klub
                        {shards > 0 ? (
                          <span className="num ml-auto text-xs text-club">
                            {shards.toLocaleString("da-DK")} shards
                          </span>
                        ) : null}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/club/rewards" className="cursor-pointer">
                        <Ticket className="mr-2 h-4 w-4" />
                        Mine belønninger
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
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                    <LogIn className="h-4 w-4" />
                    Log ind
                  </Button>
                </Link>
              )}

              <CartDrawer />

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="border-t border-border py-3 lg:hidden">
              <div className="flex flex-col">
                {NAV.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="rounded-lg px-4 py-3 font-medium text-foreground transition-colors duration-fast hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/club"
                  className="flex items-center gap-2 rounded-lg px-4 py-3 font-medium text-club transition-colors duration-fast hover:bg-club/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Sparkles className="h-5 w-5" />
                  Klub
                  {user && shards > 0 ? (
                    <span className="num ml-auto text-sm">{shards.toLocaleString("da-DK")} shards</span>
                  ) : null}
                </Link>
                {!user && (
                  <Link
                    to="/login"
                    className="flex items-center gap-2 rounded-lg px-4 py-3 font-medium text-primary transition-colors duration-fast hover:bg-primary/10"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn className="h-5 w-5" />
                    Log ind eller opret konto
                  </Link>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
