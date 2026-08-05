import { forwardRef } from "react";
import { Home, Search, Tag, Sparkles, ShoppingCart } from "lucide-react";

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartCount?: number;
  shardBalance?: number;
}

/**
 * Bottom tab bar.
 *
 * Three fixes from the identity review: the active tab used emerald rather
 * than the brand colour, "Club" was English in an otherwise Danish bar, and
 * the club badge showed floor(shards / 1000) — which reads as "0" for anyone
 * with fewer than a thousand shards. The badge now shows nothing unless
 * there is a balance worth showing.
 */
const MobileNav = forwardRef<HTMLElement, MobileNavProps>(
  ({ activeTab, onTabChange, cartCount = 0, shardBalance = 0 }, ref) => {
    const tabs = [
      { id: "home", icon: Home, label: "Hjem" },
      { id: "search", icon: Search, label: "Søg" },
      { id: "deals", icon: Tag, label: "Tilbud" },
      { id: "cart", icon: ShoppingCart, label: "Kurv", badge: cartCount || undefined },
      { id: "club", icon: Sparkles, label: "Klub", club: true },
    ];

    return (
      <nav
        ref={ref}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 8px), 8px)" }}
      >
        <div className="flex items-stretch justify-around px-2 pt-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const activeColour = tab.club ? "text-club" : "text-primary";

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex min-w-[60px] flex-col items-center justify-center py-1"
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={`relative rounded-xl p-2 transition-colors duration-fast ${
                    isActive ? (tab.club ? "bg-club/15" : "bg-primary/15") : ""
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 transition-colors duration-fast ${
                      isActive ? activeColour : "text-muted-foreground"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {tab.badge ? (
                    <span className="num absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                      {tab.badge}
                    </span>
                  ) : null}
                </span>

                <span
                  className={`mt-0.5 text-xs font-medium transition-colors duration-fast ${
                    isActive ? activeColour : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  },
);

MobileNav.displayName = "MobileNav";

export default MobileNav;
