import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KinguinProduct } from "@/lib/kinguin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import WLoader from "@/components/WLoader";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KinguinProductCard from "@/components/KinguinProductCard";

const PAGE_SIZE = 48;

/**
 * Platform families. The catalogue stores granular values ("Xbox One",
 * "PlayStation 5", "Xbox Series X|S"), so a usable filter has to match the
 * family rather than the exact string.
 */
const PLATFORM_FAMILIES = [
  { label: "Steam", match: "Steam" },
  { label: "PlayStation", match: "PlayStation" },
  { label: "Xbox", match: "Xbox" },
  { label: "Nintendo", match: "Nintendo" },
  { label: "GOG", match: "GOG" },
  { label: "EA App", match: "EA App" },
];

const SORTS = {
  discount: { label: "Største rabat først", column: "discount_percent", ascending: false },
  "price-asc": { label: "Pris: lav til høj", column: "sell_price", ascending: true },
  "price-desc": { label: "Pris: høj til lav", column: "sell_price", ascending: false },
  newest: { label: "Nyeste først", column: "updated_at", ascending: false },
  name: { label: "Navn A–Å", column: "name", ascending: true },
} as const;

type SortKey = keyof typeof SORTS;

const LIST_COLUMNS =
  "id, kinguin_id, name, cover_image, original_price, sell_price, platform, genres, region_id, region_name, is_available, qty, margin_percent, is_featured, is_on_sale, sale_label";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyFilters = (query: any, f: Filters) => {
  let q = query.eq("is_available", true);
  if (f.platform) {
    const family = PLATFORM_FAMILIES.find((p) => p.label === f.platform);
    if (family) q = q.ilike("platform", `%${family.match}%`);
  }
  if (f.genre) q = q.contains("genres", [f.genre]);
  if (f.maxPrice !== null) q = q.lte("sell_price", f.maxPrice);
  if (f.minPrice !== null) q = q.gte("sell_price", f.minPrice);
  if (f.region === "eu") q = q.in("region_id", [1, 3]);
  if (f.region === "global") q = q.eq("region_id", 3);
  if (f.onSale) q = q.gt("discount_percent", 0);
  return q;
};

interface Filters {
  platform: string | null;
  genre: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  region: string | null;
  onSale: boolean;
}

/**
 * Category / catalogue browse.
 *
 * Previously this route was an index only — platform tiles and genre pills
 * with no filtered list behind them, so picking a category told you how many
 * games existed but never showed them. It is now a real listing page: filters
 * on the left, results on the right, with the count, the sort and the active
 * filters all visible.
 */
const CategoriesPage = () => {
  const [params, setParams] = useSearchParams();

  const filters: Filters = useMemo(
    () => ({
      platform: params.get("platform"),
      genre: params.get("genre"),
      minPrice: params.get("min") ? Number(params.get("min")) : null,
      maxPrice: params.get("max") ? Number(params.get("max")) : null,
      region: params.get("region"),
      onSale: params.get("sale") === "1",
    }),
    [params],
  );

  const sortKey = (params.get("sort") as SortKey) || "discount";
  const sort = SORTS[sortKey] ?? SORTS.discount;
  const page = Math.max(1, Number(params.get("page") || 1));

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["catalogue", filters, sortKey, page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const query = applyFilters(
        supabase.from("kinguin_products").select(LIST_COLUMNS, { count: "exact" }),
        filters,
      )
        .order(sort.column, { ascending: sort.ascending })
        .range(from, from + PAGE_SIZE - 1);

      const { data: rows, count, error } = await query;
      if (error) throw error;
      return { products: (rows || []) as unknown as KinguinProduct[], total: count ?? 0 };
    },
    staleTime: 60 * 1000,
  });

  // Facet counts, so a filter tells you how much it will actually leave.
  const { data: facets } = useQuery({
    queryKey: ["catalogue-facets", filters.genre],
    queryFn: async () => {
      const entries = await Promise.all(
        PLATFORM_FAMILIES.map(async (family) => {
          let q = supabase
            .from("kinguin_products")
            .select("kinguin_id", { count: "exact", head: true })
            .eq("is_available", true)
            .ilike("platform", `%${family.match}%`);
          if (filters.genre) q = q.contains("genres", [filters.genre]);
          const { count } = await q;
          return [family.label, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
    staleTime: 10 * 60 * 1000,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const heading = filters.genre || filters.platform || "Alle spil";

  const activeChips = [
    filters.platform && { key: "platform", label: filters.platform },
    filters.genre && { key: "genre", label: filters.genre },
    filters.maxPrice !== null && { key: "max", label: `Under ${filters.maxPrice} DKK` },
    filters.minPrice !== null && { key: "min", label: `Over ${filters.minPrice} DKK` },
    filters.region === "eu" && { key: "region", label: "Virker i Danmark" },
    filters.region === "global" && { key: "region", label: "Global" },
    filters.onSale && { key: "sale", label: "På tilbud" },
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <nav className="mb-3 flex gap-2 text-sm text-muted-foreground">
            <Link to="/categories" className="transition-colors duration-fast hover:text-foreground">
              Kategorier
            </Link>
            <span className="text-border">/</span>
            <span className="text-foreground">{heading}</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="text-display text-[40px]">{heading}</h1>
              <p className="mt-2.5 text-base text-muted-foreground">
                <span className="num font-semibold text-foreground">
                  {total.toLocaleString("da-DK")}
                </span>{" "}
                spil · priser inkl. moms
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Sortér</span>
              <Select value={sortKey} onValueChange={(v) => setParam("sort", v)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SORTS).map(([key, s]) => (
                    <SelectItem key={key} value={key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto grid items-start gap-8 px-4 py-7 pb-16 lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
          <div>
            <h2 className="label-eyebrow mb-3.5 text-muted-foreground">Platform</h2>
            <div className="flex flex-col gap-3">
              {PLATFORM_FAMILIES.map((family) => (
                <label key={family.label} className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={filters.platform === family.label}
                    onCheckedChange={(checked) =>
                      setParam("platform", checked ? family.label : null)
                    }
                  />
                  <span className="flex-1 text-[15px]">{family.label}</span>
                  <span className="num text-sm text-muted-foreground/70">
                    {facets?.[family.label]?.toLocaleString("da-DK") ?? "—"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="h-px bg-border" />

          <div>
            <h2 className="label-eyebrow mb-3.5 text-muted-foreground">Pris</h2>
            <div className="flex items-center gap-2.5">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="0"
                className="num"
                defaultValue={filters.minPrice ?? ""}
                onBlur={(e) => setParam("min", e.target.value || null)}
                aria-label="Mindstepris"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Alle"
                className="num"
                defaultValue={filters.maxPrice ?? ""}
                onBlur={(e) => setParam("max", e.target.value || null)}
                aria-label="Højeste pris"
              />
              <span className="num text-sm text-muted-foreground">DKK</span>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div>
            <h2 className="label-eyebrow mb-3.5 text-muted-foreground">Region</h2>
            <div className="flex flex-col gap-3">
              <label className="flex cursor-pointer items-center gap-3">
                <Checkbox
                  checked={filters.region === "eu"}
                  onCheckedChange={(c) => setParam("region", c ? "eu" : null)}
                />
                <span className="text-[15px]">Virker i Danmark</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <Checkbox
                  checked={filters.region === "global"}
                  onCheckedChange={(c) => setParam("region", c ? "global" : null)}
                />
                <span className="text-[15px]">Global</span>
              </label>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div>
            <h2 className="label-eyebrow mb-3.5 text-muted-foreground">Kun</h2>
            <label className="flex cursor-pointer items-center gap-3">
              <Switch
                checked={filters.onSale}
                onCheckedChange={(c) => setParam("sale", c ? "1" : null)}
              />
              <span className="text-[15px]">På tilbud</span>
            </label>
          </div>
        </aside>

        <div>
          {activeChips.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2.5">
              <span className="mr-1 text-sm text-muted-foreground">Aktive filtre</span>
              {activeChips.map((chip) => (
                <button
                  key={chip.key + chip.label}
                  onClick={() => setParam(chip.key, null)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3.5 py-1.5 text-sm font-medium transition-colors duration-fast hover:border-muted-foreground/40"
                >
                  {chip.label}
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
              <button
                onClick={() => setParams(new URLSearchParams())}
                className="ml-1 text-sm font-semibold text-primary"
              >
                Nulstil
              </button>
            </div>
          )}

          {isLoading ? (
            <WLoader />
          ) : data && data.products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
                {data.products.map((product) => (
                  <KinguinProductCard key={product.kinguin_id} product={product} />
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                <p className="text-sm text-muted-foreground">
                  Viser{" "}
                  <span className="num font-semibold text-foreground">
                    {((page - 1) * PAGE_SIZE + 1).toLocaleString("da-DK")}–
                    {Math.min(page * PAGE_SIZE, total).toLocaleString("da-DK")}
                  </span>{" "}
                  af <span className="num font-semibold text-foreground">{total.toLocaleString("da-DK")}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setParam("page", String(page - 1))}
                  >
                    Forrige
                  </Button>
                  <span className="num px-2 text-sm">
                    {page} / {totalPages.toLocaleString("da-DK")}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setParam("page", String(page + 1))}
                  >
                    Næste
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-border bg-card py-20 text-center">
              <p className="text-lg font-semibold">Ingen spil matcher filtrene</p>
              <p className="mt-2 text-muted-foreground">Prøv at fjerne et filter.</p>
              <Button variant="outline" className="mt-5" onClick={() => setParams(new URLSearchParams())}>
                Nulstil filtre
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoriesPage;
