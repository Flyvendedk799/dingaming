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
 * Compressed from 90vh to roughly 380px so the real product grid sits above
 * the fold. Gone with the height: thirty drifting particles, three
 * mouse-parallax orbs, four floating cover images, a grid overlay, a countdown
 * that reset itself to 23:59:59 on every reload, and a featured deal for a
 * game that does not exist in the catalogue.
 *
 * What is left is one promise, one real discounted product, and one lime
 * button.
 */
const Hero = () => {
  const { getPrice, formatDKK } = usePricing();

  // The showcased product is real, never a hardcoded title.
  //
  // Kinguin gives us one price, so the sync writes it to both original_price
  // and sell_price and nothing carries a genuine saving. Rather than invent a
  // "was" price to strike through, the card shows the newest catalogue
  // addition and says so; it only claims a discount once a real one exists.
  const { data: featured } = useQuery({
    queryKey: ["hero-featured"],
    queryFn: async () => {
      const products = await fetchKinguinProducts(24, undefined, { requireCoverImage: true });
      if (products.length === 0) return null;

      const best = products
        .map((product) => ({ product, discount: discountPercent(product) }))
        .sort((a, b) => b.discount - a.discount)[0];

      return best.discount > 0 ? best : { product: products[0], discount: 0 };
    },
    staleTime: 5 * 60 * 1000,
  });

  const deal = featured;

  return (
    <section className="border-b border-border">
      <div className="container mx-auto grid items-center gap-12 px-4 py-12 lg:grid-cols-[1fr_400px] lg:py-14">
        <div>
          <h1 className="text-display max-w-[720px] text-4xl sm:text-5xl lg:text-[60px]">
            Køb spillet.
            <br />
            Få nøglen inden for 60 sekunder.
          </h1>
          <p className="mt-5 max-w-[520px] text-lg leading-relaxed text-muted-foreground">
            Officielle nøgler til Steam, PlayStation, Xbox og Nintendo. Priser inkl. moms — ingen
            gebyrer ved betaling.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <Link to="/search">Se alle spil</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/deals">Ugens tilbud</Link>
            </Button>
          </div>
        </div>

        {deal && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="label-eyebrow text-muted-foreground">
                {deal.discount > 0 ? "Største rabat lige nu" : "Nyeste i kataloget"}
              </span>
              {deal.discount > 0 && (
                <span className="num text-[13px] font-bold text-destructive">
                  −{deal.discount}&nbsp;%
                </span>
              )}
            </div>
            <Link
              to={`/product/${deal.product.kinguin_id}`}
              className="flex gap-4 p-5 transition-colors duration-fast hover:bg-muted/40"
            >
              <img
                src={deal.product.cover_image || "/placeholder.svg"}
                alt={deal.product.name}
                className="aspect-[3/4] w-[116px] flex-none rounded-lg object-cover"
                loading="lazy"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="label-eyebrow text-muted-foreground">
                  {platformAndRegion(deal.product)}
                </p>
                <p className="mt-1.5 line-clamp-2 text-lg font-semibold leading-snug">
                  {deal.product.name}
                </p>
                <div className="mt-3 flex items-baseline gap-2.5">
                  <span className="num text-[32px] font-bold leading-none text-primary">
                    {formatDKK(getPrice(deal.product.sell_price, deal.product.margin_percent))}
                  </span>
                  {deal.discount > 0 && (
                    <span className="num text-[15px] text-muted-foreground/70 line-through">
                      {formatDKK(getPrice(deal.product.original_price, deal.product.margin_percent))}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">Inkl. moms</p>
                <p className="mt-3 text-[13px] text-muted-foreground">{DELIVERY_PROMISE}</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;
