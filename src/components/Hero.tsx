import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Gamepad, Gamepad2, Headphones, Joystick, Monitor, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchKinguinProducts } from "@/lib/kinguin";
import { usePricing } from "@/lib/pricing";
import { discountPercent, platformAndRegion } from "@/lib/product";
import { DELIVERY_PROMISE } from "@/components/Header";

/**
 * Hero.
 *
 * The featured product carries the page: it takes the wider column with cover
 * art at real size and the screen's single lime button. A shop's landing
 * should lead with something you can buy, not a slogan.
 *
 * The left column is filled to match that card's height — headline, then the
 * four platform entry points, then the trust row. Previously it was a headline
 * and two buttons beside a 600px card, which left most of the column empty.
 *
 * Gone from the original: thirty drifting particles, three mouse-parallax
 * orbs, four floating covers, a grid overlay, a countdown that reset to
 * 23:59:59 on every reload, and a featured deal for a game that was not in the
 * catalogue.
 */

/** Matches the families on the category page so the links land on real filters. */
const PLATFORMS = [
  { label: "PC", family: "PC", icon: Monitor },
  { label: "PlayStation", family: "PlayStation", icon: Gamepad2 },
  { label: "Xbox", family: "Xbox", icon: Gamepad },
  { label: "Switch", family: "Nintendo", icon: Joystick },
];

const TRUST = [
  { icon: ShieldCheck, title: "Officielle nøgler", body: "Fra autoriserede forhandlere" },
  { icon: Zap, title: "Levering på 60 sek.", body: "Direkte på din e-mail" },
  { icon: Headphones, title: "Dansk support", body: "Svar inden 24 timer" },
];

const Hero = () => {
  const { getPrice, formatDKK } = usePricing();

  const { data: featured } = useQuery({
    queryKey: ["hero-featured"],
    queryFn: async () => {
      const products = await fetchKinguinProducts(24, undefined, {
        requireCoverImage: true,
        gamesOnly: true,
        order: "stocked",
        priceRange: { min: 8, max: 80 },
      });
      if (products.length === 0) return null;
      const best = products
        .map((product) => ({ product, discount: discountPercent(product) }))
        .sort((a, b) => b.discount - a.discount)[0];
      return best.discount > 0 ? best : { product: products[0], discount: 0 };
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: counts } = useQuery({
    queryKey: ["hero-platform-counts"],
    queryFn: async () => {
      const patterns: Record<string, string[]> = {
        PC: ["Steam", "Epic", "GOG", "EA App", "Ubisoft"],
        PlayStation: ["PlayStation"],
        Xbox: ["Xbox"],
        Nintendo: ["Nintendo"],
      };
      const entries = await Promise.all(
        Object.entries(patterns).map(async ([family, matches]) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const q: any = supabase
            .from("kinguin_products")
            .select("kinguin_id", { count: "exact", head: true });
          const { count } = await q
            .eq("is_available", true)
            .eq("is_game", true)
            .or(matches.map((m) => `platform.ilike.*${m}*`).join(","));
          return [family, (count as number) ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
    staleTime: 30 * 60 * 1000,
  });

  const product = featured?.product;
  const discount = featured?.discount ?? 0;
  const price = product ? getPrice(product.sell_price, product.margin_percent) : 0;
  const was = product ? getPrice(product.original_price, product.margin_percent) : 0;

  return (
    <section className="border-b border-border">
      {/* items-stretch, not items-start: the two columns share a grid row, so
          stretching makes them exactly equal height and gives the left column
          slack to distribute. With items-start each column sized to its own
          content and the shorter one simply ended early. */}
      <div className="container mx-auto grid items-stretch gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,480px)] lg:gap-12 lg:py-12">
        <div className="flex flex-col">
          <h1 className="text-display text-[34px] sm:text-[44px] lg:text-[54px]">
            Køb spillet.
            <br />
            Få nøglen inden for 60 sekunder.
          </h1>
          <p className="mt-4 max-w-[500px] text-[17px] leading-relaxed text-muted-foreground">
            Officielle nøgler til Steam, PlayStation, Xbox og Nintendo. Priser inkl. moms — ingen
            gebyrer ved betaling.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="lg">
              <Link to="/search">Se alle spil</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="text-muted-foreground">
              <Link to="/deals">Tilbud</Link>
            </Button>
          </div>

          {/* Four ways into the catalogue, straight from the fold. `grow`
              absorbs the column's leftover height into the tiles — they are
              the clickable part, so height is presence rather than padding —
              and the max caps them before they turn into slabs. Whatever the
              cap leaves over goes to the trust row's mt-auto, which pins it
              level with the bottom of the card. */}
          <div className="mt-7 grid grow grid-cols-2 gap-3 sm:grid-cols-4 lg:max-h-[168px]">
            {PLATFORMS.map(({ label, family, icon: Icon }) => (
              <Link
                key={label}
                to={`/categories?platform=${encodeURIComponent(family)}`}
                className="game-card flex min-h-[104px] flex-col items-center justify-center gap-2.5 px-3 py-5 text-center"
              >
                <Icon className="h-7 w-7 text-primary" strokeWidth={1.6} />
                <span className="text-sm font-semibold leading-none">{label}</span>
                <span className="num text-xs text-muted-foreground">
                  {counts?.[family] !== undefined
                    ? `${counts[family].toLocaleString("da-DK")} spil`
                    : "—"}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-auto grid gap-4 pt-8 sm:grid-cols-3">
            {TRUST.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 h-[18px] w-[18px] flex-none text-primary" />
                <div>
                  <p className="text-sm font-semibold leading-tight">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {product && (
          <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            <Link to={`/product/${product.kinguin_id}`} className="group block">
              {/* Source art is 8:7; 4:3 widens it into a hero shape while
                  trimming only ~7% from top and bottom, centred. */}
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={product.cover_image || "/placeholder.svg"}
                  alt={product.name}
                  className="h-full w-full object-cover object-center"
                  // Largest element above the fold, so it is the page's LCP.
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/85 to-transparent" />

                <span className="label-eyebrow absolute left-4 top-3.5 text-foreground/90">
                  {discount > 0 ? "Største rabat lige nu" : "Udvalgt spil"}
                </span>

                {discount > 0 && (
                  <span className="num absolute right-4 top-3.5 rounded-md bg-destructive px-2.5 py-1 text-[13px] font-bold text-destructive-foreground">
                    −{discount}&nbsp;%
                  </span>
                )}
              </div>

              <div className="px-5 pt-5">
                <p className="label-eyebrow text-muted-foreground">{platformAndRegion(product)}</p>
                <h2 className="mt-2 line-clamp-2 text-[22px] font-bold leading-tight tracking-tight transition-colors duration-fast group-hover:text-primary">
                  {product.name}
                </h2>
                <div className="mt-3 flex flex-wrap items-baseline gap-3">
                  <span className="num text-[34px] font-bold leading-none text-primary">
                    {formatDKK(price)}
                  </span>
                  {discount > 0 && (
                    <span className="num text-lg text-muted-foreground/70 line-through">
                      {formatDKK(was)}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">Inkl. moms</span>
                </div>
              </div>
            </Link>

            {/* mt-auto so the buy button sits on the card's bottom edge if the
                left column is ever the taller of the two. */}
            <div className="mt-auto p-5 pt-4">
              <Button asChild size="lg" className="w-full text-[17px]">
                <Link to={`/product/${product.kinguin_id}`}>Se spillet</Link>
              </Button>
              <p className="mt-3 flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {DELIVERY_PROMISE}
              </p>
            </div>
          </article>
        )}
      </div>
    </section>
  );
};

export default Hero;
