import { useQuery } from "@tanstack/react-query";
import { fetchKinguinProducts, KinguinProduct } from "@/lib/kinguin";
import { daGenre } from "@/lib/da";
import KinguinProductCard from "@/components/KinguinProductCard";
import { ProductGridSkeleton } from "@/components/ui/ProductCardSkeleton";

/**
 * "More like this" on the product page.
 *
 * A product page previously offered exactly two ways out: buy, or leave. The
 * only other shelf was recently-viewed, which by definition contains nothing
 * new. This gives the visitor somewhere to go when the game in front of them
 * is not quite the one — which is the common case in a catalogue of 29,000.
 *
 * Matching is genre first (the strongest signal Kinguin gives us), then
 * platform, so a PlayStation buyer is not shown Steam keys they cannot use.
 * Ordered by stock rather than recency, because `updated_at` is churned by the
 * product webhook and would make the shelf reshuffle on every visit.
 */
const RelatedProducts = ({ product }: { product: KinguinProduct }) => {
  const genre = product.genres?.[0];
  const platform = product.platform ?? undefined;

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["related", product.kinguin_id, genre, platform],
    queryFn: async () => {
      const base = {
        requireCoverImage: true,
        gamesOnly: true,
        order: "stocked" as const,
        excludeKinguinId: product.kinguin_id,
        priceRange: { min: 3 },
      };

      // Genre + platform is the tightest match; widen only if it comes up short
      // rather than showing four cards under a heading built for eight.
      if (genre) {
        const tight = await fetchKinguinProducts(8, undefined, { ...base, genre, platform });
        if (tight.length >= 4) return tight;

        const byGenre = await fetchKinguinProducts(8, undefined, { ...base, genre });
        if (byGenre.length >= 4) return byGenre;
      }

      return fetchKinguinProducts(8, undefined, { ...base, platform });
    },
    staleTime: 10 * 60 * 1000,
  });

  if (!isLoading && products.length < 4) return null;

  const heading = genre ? `Mere ${daGenre(genre).toLowerCase()}` : "Andre spil du kan lide";

  return (
    <section className="border-t border-border py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-6 text-[26px]">{heading}</h2>
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {products.slice(0, 4).map((p, i) => (
              <KinguinProductCard key={p.kinguin_id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RelatedProducts;
