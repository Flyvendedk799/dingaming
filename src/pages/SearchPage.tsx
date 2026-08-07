import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchKinguinProducts, KinguinProduct } from "@/lib/kinguin";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KinguinProductCard from "@/components/KinguinProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import WMark from "@/components/WMark";
import { useSeo } from "@/lib/seo";
import { daGenre, daPlatform } from "@/lib/da";

const SearchPage = () => {
  useSeo({ title: "Søg", description: "Søg i hele kataloget af digitale spilnøgler til Steam, PlayStation, Xbox og Nintendo.", path: "/search", noindex: true });
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const platformFilter = searchParams.get("platform") || "";
  const genreFilter = searchParams.get("genre") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<KinguinProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchQuery?: string, platform?: string, genre?: string) => {
    setIsLoading(true);
    setHasSearched(true);

    // With nothing asked for, this is a browse page rather than a search. It is
    // where "Alle spil" in the nav and the hero's own button both land, so it
    // has to show stock, not an empty prompt.
    const isBrowse = !searchQuery?.trim() && !platform && !genre;

    try {
      // Ordered by stock, not updated_at: the product webhook touches ~3,700
      // rows an hour, so recency here is close to random and the same search
      // returned a different order every time. Stock ranks the mainstream
      // titles first, which is the better answer for both modes.
      // Held loosely from the first link: each conditional filter below
      // re-generics the builder and tsc gives up at "type instantiation is
      // excessively deep". Annotating the variable is not enough — the
      // initialiser is what gets checked.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base: any = supabase.from('kinguin_products').select('*');

      let dbQuery = base
        .eq('is_available', true)
        .order('qty', { ascending: false })
        .limit(100);

      if (isBrowse) {
        // Only on the browse view — someone who explicitly searches "Rewarble",
        // a gift card or a specific DLC should still find it.
        //
        // Stock alone ranks 1 kr cosmetic DLC above the games they belong to,
        // because add-ons are held in huge quantities. The price floor and the
        // name check push those under the base games without needing a DLC
        // flag, which Kinguin does not provide.
        dbQuery = dbQuery
          .eq('is_game', true)
          .not('cover_image', 'is', null)
          .neq('cover_image', '')
          .gte('sell_price', 2)
          .not('name', 'ilike', '%DLC%');
      }

      // Apply text search
      if (searchQuery?.trim()) {
        dbQuery = dbQuery.ilike('name', `%${searchQuery.trim()}%`);
      }

      // Apply platform filter
      if (platform) {
        dbQuery = dbQuery.eq('platform', platform);
      }

      // Apply genre filter (genres is an array, use contains)
      if (genre) {
        dbQuery = dbQuery.contains('genres', [genre]);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Search error:', error);
        setProducts([]);
      } else {
        setProducts((data || []) as KinguinProduct[]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Runs unconditionally now. Previously it only fired when a param was
  // present, so arriving at /search — the destination of the main nav's
  // "Alle spil" and the hero's primary button — showed a search box above an
  // empty page.
  useEffect(() => {
    handleSearch(initialQuery, platformFilter, genreFilter);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL params
    const params: Record<string, string> = {};
    if (query.trim()) params.q = query.trim();
    if (platformFilter) params.platform = platformFilter;
    if (genreFilter) params.genre = genreFilter;
    setSearchParams(params);
    
    handleSearch(query, platformFilter, genreFilter);
  };

  const clearSearch = () => {
    setQuery("");
    setSearchParams({});
    // Falls back to browsing rather than blanking the page.
    handleSearch();
  };

  const clearFilter = (filterType: 'platform' | 'genre') => {
    const params: Record<string, string> = {};
    if (query.trim()) params.q = query.trim();
    if (filterType !== 'platform' && platformFilter) params.platform = platformFilter;
    if (filterType !== 'genre' && genreFilter) params.genre = genreFilter;
    setSearchParams(params);
    
    handleSearch(
      query, 
      filterType === 'platform' ? undefined : platformFilter,
      filterType === 'genre' ? undefined : genreFilter
    );
  };

  const isBrowsing = !initialQuery && !platformFilter && !genreFilter;

  const getSearchTitle = () => {
    const parts = [];
    if (platformFilter) parts.push(daPlatform(platformFilter));
    if (genreFilter) parts.push(daGenre(genreFilter));
    if (initialQuery) parts.push(`"${initialQuery}"`);
    return parts.length > 0 ? parts.join(' • ') : 'Alle spil';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Search Header */}
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            {getSearchTitle()}
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Find dit næste eventyr blandt vores udvalg af game keys
          </p>

          {/* Active Filters */}
          {(platformFilter || genreFilter) && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {platformFilter && (
                <button
                  onClick={() => clearFilter('platform')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary hover:bg-primary/20 transition-colors"
                >
                  {daPlatform(platformFilter)}
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {genreFilter && (
                <button
                  onClick={() => clearFilter('genre')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-sm transition-colors duration-fast hover:border-muted-foreground/40"
                >
                  {daGenre(genreFilter)}
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Søg efter spil, f.eks. FIFA, GTA, Cyberpunk..."
                  className="pl-12 pr-10 h-14 text-lg bg-card border-border focus:border-primary"
                />
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <Button type="submit" size="lg" className="h-14 px-8">
                <Search className="w-5 h-5 mr-2" />
                Søg
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <WMark size={40} motion="loop" label="Indlæser" />
          </div>
        ) : hasSearched ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {isBrowsing ? (
                  "Mest tilgængelige spil lige nu — søg ovenfor for at finde en bestemt titel"
                ) : (
                  <>
                    {products.length} {products.length === 1 ? "resultat" : "resultater"}
                    {initialQuery && ` for "${initialQuery}"`}
                    {platformFilter && ` i ${daPlatform(platformFilter)}`}
                    {genreFilter && ` (${daGenre(genreFilter)})`}
                  </>
                )}
              </p>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    // Capped: the stagger was index * 0.05 against a 100-result
                    // grid, so the last card faded in 5 seconds after the
                    // first. Only the top rows read as a stagger anyway.
                    transition={{ delay: Math.min(index, 7) * 0.03, duration: 0.24 }}
                  >
                    <KinguinProductCard product={product} index={index} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-heading text-2xl text-foreground mb-2">
                  Ingen resultater fundet
                </h3>
                <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                  Vi har {initialQuery ? `ikke "${initialQuery}"` : "ikke noget her"} lige nu.
                  Titler staves som hos udgiveren — prøv f.eks. "Call of Duty" frem for "COD".
                </p>
                {/* Was a link to "/" labelled "Se alle spil", which left the
                    search behind entirely. Clearing keeps them on the results
                    page with the full catalogue in front of them. */}
                <Button variant="outline" onClick={clearSearch}>
                  Ryd søgningen og se alle spil
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            {/* Only reachable for the instant before the browse query
                resolves — the page no longer sits here waiting for input. */}
            <h3 className="font-heading text-2xl text-foreground mb-2">Henter spil…</h3>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
