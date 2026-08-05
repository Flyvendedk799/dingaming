import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Loader2, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import MobileGameTile from "./MobileGameTile";
import { DELIVERY_PROMISE } from "@/components/Header";
import { fetchKinguinProducts, KinguinProduct } from "@/lib/kinguin";
import { discountPercent } from "@/lib/product";
import { useAuth } from "@/contexts/AuthContext";
import { useShardBalance, useDailyLoginStreak, useClaimDailyShards } from "@/hooks/useShards";

interface MobileHomeProps {
  onSelectGame: (product: KinguinProduct) => void;
}

/**
 * Mobile front page.
 *
 * Stripped of the invented numbers that used to sit above the products:
 * "Spar op til 70 %", "30 sek", "100 % garanti" and "50K+ kunder" were all
 * hardcoded, and none of them came from anything measurable. The delivery
 * promise now matches the one used everywhere else, word for word.
 */
const MobileHome = ({ onSelectGame }: MobileHomeProps) => {
  const [products, setProducts] = useState<KinguinProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { data: balance } = useShardBalance();
  const { data: lastLogin } = useDailyLoginStreak();
  const claimDaily = useClaimDailyShards();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchKinguinProducts(12, undefined, { requireCoverImage: true });
        setProducts(data);
      } catch (e) {
        console.error("Error loading products:", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const canClaimDaily = user && (!lastLogin || lastLogin.login_date !== today);

  const trending = products.slice(0, 6);
  const deals = products.filter((p) => discountPercent(p) >= 20).slice(0, 6);
  const secondRow = deals.length > 0 ? deals : products.slice(6, 12);

  const tileProps = (product: KinguinProduct) => ({
    title: product.name,
    image: product.cover_image || "",
    kinguinId: product.kinguin_id,
    price: product.sell_price,
    marginPercent: product.margin_percent,
    originalPrice: product.original_price,
    platform: product.platform || "Steam",
    discount: discountPercent(product),
    onClick: () => onSelectGame(product),
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div
        className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" aria-label="WGaming forside">
            <Logo size={28} />
          </Link>
          {user ? (
            <Link to="/club">
              <span className="num flex items-center gap-1.5 rounded-lg border border-club/20 bg-club/10 px-3 py-2 text-sm font-semibold text-club">
                <Sparkles className="h-4 w-4" />
                {(balance?.balance || 0).toLocaleString("da-DK")}
              </span>
            </Link>
          ) : (
            <Link to="/login">
              <Button size="sm" variant="outline" className="gap-2">
                <LogIn className="h-4 w-4" />
                Log ind
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="border-b border-border px-4 py-5">
        <h1 className="text-display text-[28px]">
          Køb spillet.
          <br />
          Få nøglen inden for 60 sekunder.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Officielle nøgler til Steam, PlayStation, Xbox og Nintendo. Priser inkl. moms.
        </p>
        <Button className="mt-4 w-full" onClick={() => navigate("/search")}>
          Se alle spil
        </Button>
      </div>

      {canClaimDaily && (
        <div className="mx-4 mt-4 rounded-xl border border-club/20 bg-club/[0.08] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Daglig bonus klar</p>
              <p className="text-xs text-muted-foreground">Hent dine gratis shards</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => claimDaily.mutate()}
              disabled={claimDaily.isPending}
            >
              {claimDaily.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hent"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <section className="mb-6 mt-5">
            <div className="mb-3 flex items-center justify-between px-4">
              <h2 className="text-lg font-bold">Populære lige nu</h2>
              <button
                onClick={() => navigate("/search")}
                className="flex items-center text-sm font-medium text-primary"
              >
                Se alle <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
              {trending.map((product) => (
                <div key={product.id} className="w-[150px] flex-shrink-0 snap-start">
                  <MobileGameTile {...tileProps(product)} />
                </div>
              ))}
            </div>
          </section>

          <section className="mb-6 px-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{deals.length > 0 ? "Bedste tilbud" : "Flere spil"}</h2>
              <button
                onClick={() => navigate(deals.length > 0 ? "/deals" : "/search")}
                className="flex items-center text-sm font-medium text-primary"
              >
                Se alle <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {secondRow.map((product) => (
                <MobileGameTile key={product.id} {...tileProps(product)} />
              ))}
            </div>
          </section>

          <p className="px-4 pb-4 text-center text-xs text-muted-foreground">{DELIVERY_PROMISE}</p>

          {!user && (
            <div className="mx-4 mb-6 rounded-xl border border-club/20 bg-club/[0.08] p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-club/15">
                  <Sparkles className="h-6 w-6 text-club" />
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold">Klub</h3>
                  <p className="text-xs text-muted-foreground">Optjen shards på alle køb.</p>
                </div>
                <Link to="/signup">
                  <Button size="sm" variant="outline">
                    Opret
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MobileHome;
