import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Platform shelf.
 *
 * This section never got the redesign. It was four gradient tiles in blue,
 * indigo, green and red — none of them colours in the design system — with
 * hardcoded counts ("1.200+ spil", "450+ spil") that were never true and never
 * updated, every one linking to href="#". The counts now come from the
 * catalogue and each tile goes to its filtered listing.
 */
const PLATFORMS = [
  { label: "Steam", match: "Steam" },
  { label: "PlayStation", match: "PlayStation" },
  { label: "Xbox", match: "Xbox" },
  { label: "Nintendo", match: "Nintendo" },
];

const Platforms = () => {
  const { data: counts } = useQuery({
    queryKey: ["platform-counts"],
    queryFn: async () => {
      const entries = await Promise.all(
        PLATFORMS.map(async (p) => {
          // Held loosely for the same reason as the catalogue queries: the
          // builder's generics compound per filter until tsc gives up.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const query: any = supabase
            .from("kinguin_products")
            .select("kinguin_id", { count: "exact", head: true });
          const { count } = await query
            .eq("is_available", true)
            .eq("is_game", true)
            .ilike("platform", `%${p.match}%`);
          return [p.label, (count as number) ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
    staleTime: 30 * 60 * 1000,
  });

  return (
    <section className="border-t border-border py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-[34px]">Vælg platform</h2>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {PLATFORMS.map((platform) => (
            <Link
              key={platform.label}
              to={`/categories?platform=${encodeURIComponent(platform.label)}`}
              className="game-card p-6"
            >
              <div className="text-lg font-semibold">{platform.label}</div>
              <div className="num mt-1 text-sm text-muted-foreground">
                {counts?.[platform.label] !== undefined
                  ? `${counts[platform.label].toLocaleString("da-DK")} spil`
                  : "—"}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Platforms;
