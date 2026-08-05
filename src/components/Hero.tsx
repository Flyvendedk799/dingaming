import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchKinguinProducts } from "@/lib/kinguin";
import { usePricing } from "@/lib/pricing";
import { discountPercent, platformAndRegion } from "@/lib/product";
import { DELIVERY_PROMISE } from "@/components/Header";

/**
 * Hero.
 *
 * Compressed from the original 90vh so the product grid sits near the fold.
 * Gone with the height: thirty drifting particles, three mouse-parallax orbs,
 * four floating cover images, a grid overlay, a countdown that reset itself to
 * 23:59:59 on every reload, and a featured deal for a game that was not in the
 * catalogue.
 *
 * The featured product carries the page rather than sitting beside it as a
 * 400px sidebar with a thumbnail: it gets the wider column, cover art at real
 * size, and the screen's single lime button. The copy beside it is deliberately
 * secondary — a shop's landing should lead with a product, not a slogan.
 */
const Hero = () => {
  const { getPrice, formatDKK } = usePricing();

  // Real, in-stock, and a game rather than a gift card. Never a hardcoded
  // title, and never ordered by updated_at — the product webhook churns that
  // constantly, which made the pick change on every reload.
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

  const product = featured?.product;
  const discount = featured?.discount ?? 0;
  const price = product ? getPrice(product.sell_price, product.margin_percent) : 0;
  const was = product ? getPrice(product.original_price, product.margin_percent) : 0;

  return (
    <section className="border-b border-border">
      <div className="container mx-auto grid items-center gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(460px,560px)] lg:gap-16 lg:py-12">
        <div>
          <h1 className="text-display text-[34px] sm:text-[44px] lg:text-[52px]">
            Køb spillet.
            <br />
            Få nøglen inden for 60 sekunder.
          </h1>
          <p className="mt-5 max-w-[460px] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Officielle nøgler til Steam, PlayStation, Xbox og Nintendo. Priser inkl. moms — ingen
            gebyrer ved betaling.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="lg">
              <Link to="/search">Se alle spil</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="text-muted-foreground">
              <Link to="/categories">Browse kategorier</Link>
            </Button>
          </div>
        </div>

        {product && (
          <article className="overflow-hidden rounded-xl border border-border bg-card">
            <Link to={`/product/${product.kinguin_id}`} className="group block">
              {/* Source art is 8:7; 4:3 widens it into a hero shape while
                  trimming only ~7% from top and bottom, centred, so key art
                  survives. A 16:9 crop would have taken a third of it. */}
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={product.cover_image || "/placeholder.svg"}
                  alt={product.name}
                  className="h-full w-full object-cover object-center"
                  // This is the largest element above the fold, so it is the
                  // page's LCP: load it eagerly rather than lazily.
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
                {/* Keeps the label legible over bright cover art. */}
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

              <div className="p-6">
                <p className="label-eyebrow text-muted-foreground">{platformAndRegion(product)}</p>
                <h2 className="mt-2 line-clamp-2 text-[26px] font-bold leading-tight tracking-tight transition-colors duration-fast group-hover:text-primary">
                  {product.name}
                </h2>

                <div className="mt-4 flex flex-wrap items-baseline gap-3">
                  <span className="num text-[40px] font-bold leading-none text-primary">
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

            <div className="px-6 pb-6">
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
