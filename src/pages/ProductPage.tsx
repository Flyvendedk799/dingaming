import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchKinguinProductById, KinguinProduct } from "@/lib/kinguin";
import { usePricing } from "@/lib/pricing";
import { discountPercent as calcDiscount, regionLabel } from "@/lib/product";
import { useCartStore } from "@/stores/cartStore";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Gamepad2, Play, X } from "lucide-react";
import WLoader from "@/components/WLoader";
import { toast } from "sonner";
import { breadcrumbLd, productLd, useSeo, SITE_URL } from "@/lib/seo";
import Header, { DELIVERY_PROMISE } from "@/components/Header";
import Footer from "@/components/Footer";
import RecentlyViewed from "@/components/RecentlyViewed";
import { daGenres, daPlatform, daProductName, daSummary } from "@/lib/da";

const VAT_RATE = 0.25;

type Media = { kind: "image"; url: string; thumb?: string } | { kind: "video"; id: string };

/**
 * Kinguin's thumbnail URLs are unreliable — the older `/cache/200x120/` paths
 * resolve but the newer `cdn-cgi/image/...` ones 404. Since a full-size
 * screenshot is ~785KB, it is still worth trying the thumbnail first and
 * falling back once, rather than loading eight full frames into a strip.
 */
const Thumb = ({ src, fallback }: { src: string; fallback: string }) => (
  <img
    src={src}
    alt=""
    className="h-full w-full object-cover"
    loading="lazy"
    decoding="async"
    onError={(e) => {
      const img = e.currentTarget;
      if (img.dataset.fellBack) return; // never loop if the full size 404s too
      img.dataset.fellBack = "1";
      img.src = fallback;
    }}
  />
);

/**
 * Product page.
 *
 * Restructured around the five questions a buyer asks before paying, in this
 * order: what exactly am I buying, does it work for me, what does it cost in
 * total, when do I get it, and what happens if it does not work. The sticky
 * buy column answers all five above the button.
 *
 * Removed: the 40–50vh decorative cover banner (the same image as the gallery
 * below it, stretched, pushing the price off screen), the duplicated title,
 * and the "kun {qty} tilbage" pulse — a supplier stock number is not scarcity
 * on a digital key.
 */
const ProductPage = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<KinguinProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const { addProduct: addToRecentlyViewed } = useRecentlyViewed();
  const { getPrice, formatDKK } = usePricing();

  useEffect(() => {
    const loadProduct = async () => {
      if (!handle) return;
      setIsLoading(true);
      const kinguinId = parseInt(handle, 10);
      if (!Number.isNaN(kinguinId)) {
        const data = await fetchKinguinProductById(kinguinId);
        setProduct(data);
        if (data) addToRecentlyViewed(data);
      }
      setIsLoading(false);
    };
    loadProduct();
  }, [handle, addToRecentlyViewed]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [handle]);

  const priceDKK = product ? getPrice(product.sell_price, product.margin_percent) : 0;
  const originalDKK = product ? getPrice(product.original_price, product.margin_percent) : 0;

  const addToCart = useCallback(() => {
    if (!product) return false;
    if (!product.is_available) {
      toast.error("Udsolgt", { description: "Dette produkt kan ikke købes lige nu." });
      return false;
    }
    addItem({
      variantId: `kinguin-${product.kinguin_id}`,
      kinguinId: product.kinguin_id,
      title: product.name,
      quantity: 1,
      price: { amount: String(priceDKK), currencyCode: "DKK" },
      originalAmount: product.original_price > product.sell_price ? String(originalDKK) : undefined,
      image: product.cover_image || undefined,
      sku: `KINGUIN-${product.kinguin_id}`,
    });
    return true;
  }, [product, addItem, priceDKK, originalDKK]);

  // Hooks cannot sit behind the early returns below, so this runs on every
  // render and simply has nothing to say until the product has loaded.
  const seoPath = product ? `/product/${product.kinguin_id}` : undefined;
  const seoPlatform = daPlatform(product?.platform) || "Steam";
  // Google indexes what the page shows, so the Danish name is the canonical
  // one here too — not the English boilerplate it was built from.
  const seoName = product ? daProductName(product.name) : "";
  useSeo({
    title: product ? `${seoName} — ${seoPlatform} nøgle` : undefined,
    description: product
      ? `Køb ${seoName} til ${seoPlatform}. Officiel digital nøgle, pris inkl. moms, på e-mail inden for 60 sekunder.`
      : undefined,
    path: seoPath,
    image: product?.cover_image ?? undefined,
    type: "product",
    jsonLd:
      product && seoPath
        ? [
            productLd({
              name: seoName,
              description: daSummary(product),
              image: product.cover_image,
              sku: product.kinguin_id,
              platform: seoPlatform,
              priceDkk: priceDKK,
              inStock: Boolean(product.is_available),
              url: `${SITE_URL}${seoPath}`,
            }),
            breadcrumbLd([
              { name: "Spil", path: "/search" },
              { name: seoPlatform, path: `/search?platform=${encodeURIComponent(seoPlatform)}` },
              { name: seoName, path: seoPath },
            ]),
          ]
        : undefined,
  });

  if (isLoading) {
    return <WLoader fullscreen label="Indlæser produkt" />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <Gamepad2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-4 text-3xl">Produktet findes ikke</h1>
          <p className="mb-6 text-muted-foreground">
            Spillet er enten fjernet fra kataloget, eller linket er forkert.
          </p>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/search">
              <ArrowLeft className="h-4 w-4" />
              Se alle spil
            </Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const discount = calcDiscount(product);
  const region = regionLabel(product);
  const platform = seoPlatform;
  const vatPortion = priceDKK * (VAT_RATE / (1 + VAT_RATE));
  const shardsEarned = Math.max(0, Math.round(priceDKK));
  // Cover first, then the trailer, then screenshots. Kinguin carries 5-7
  // screenshots and a YouTube trailer for ~96% of the catalogue; the sync was
  // reading the wrong field, so until now this list was always length 1.
  const trailer = product.videos?.[0];
  const media: Media[] = [
    ...(product.cover_image ? [{ kind: "image" as const, url: product.cover_image }] : []),
    ...(trailer ? [{ kind: "video" as const, id: trailer.id }] : []),
    ...(product.screenshots || []).map((url, i) => ({
      kind: "image" as const,
      url,
      thumb: product.screenshot_thumbs?.[i] || undefined,
    })),
  ];

  const current = media[Math.min(selectedImage, media.length - 1)];
  const nextImage = () => setSelectedImage((p) => (p + 1) % media.length);
  const prevImage = () => setSelectedImage((p) => (p - 1 + media.length) % media.length);

  const handleBuyNow = () => {
    if (addToCart()) navigate("/checkout");
  };

  const handleAddToCart = () => {
    if (addToCart()) toast.success("Lagt i kurven", { description: product.name });
  };

  const activationSteps = [
    `Åbn ${platform} og vælg Aktivér et produkt.`,
    "Indsæt nøglen fra din e-mail.",
    "Spillet ligger nu i dit bibliotek og kan hentes.",
  ];

  const details: Array<[string, string]> = [
    ["Type", "Digital nøgle — ikke en fysisk vare"],
    ["Platform", platform],
    ["Region", region ? (region === "Global" ? "Global — virker i hele verden" : `${region} — virker i EU`) : "Ikke oplyst"],
    ...(product.release_date
      ? ([["Udgivelse", new Date(product.release_date).toLocaleDateString("da-DK", { year: "numeric", month: "long" })]] as Array<[string, string]>)
      : []),
    ...(product.genres?.length
      ? ([["Genrer", daGenres(product.genres).join(", ")]] as Array<[string, string]>)
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <nav className="container mx-auto flex gap-2 px-4 pt-6 text-sm text-muted-foreground">
        <Link to="/search" className="transition-colors duration-fast hover:text-foreground">
          Spil
        </Link>
        <span className="text-border">/</span>
        <Link
          to={`/search?platform=${encodeURIComponent(platform)}`}
          className="transition-colors duration-fast hover:text-foreground"
        >
          {platform}
        </Link>
        <span className="text-border">/</span>
        <span className="truncate text-foreground">{daProductName(product.name)}</span>
      </nav>

      <main className="container mx-auto grid items-start gap-10 px-4 py-7 pb-16 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-6">
          {media.length > 0 && current && (
            <>
              <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
                {current.kind === "video" ? (
                  // Only mounted once the trailer is actually selected — an
                  // autoloaded YouTube embed would pull ~900KB of third-party
                  // script onto every product page.
                  <iframe
                    key={current.id}
                    src={`https://www.youtube-nocookie.com/embed/${current.id}?rel=0`}
                    title={`${product.name} — trailer`}
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <img
                    src={current.url}
                    alt={product.name}
                    className="aspect-video w-full cursor-zoom-in object-cover"
                    onClick={() => setIsLightboxOpen(true)}
                  />
                )}
                {media.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur transition-colors duration-fast hover:bg-background"
                      aria-label="Forrige billede"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur transition-colors duration-fast hover:bg-background"
                      aria-label="Næste billede"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <span className="num absolute bottom-3 right-3 rounded-md bg-background/85 px-2.5 py-1 text-xs">
                      {selectedImage + 1} / {media.length}
                    </span>
                  </>
                )}
              </div>

              {media.length > 1 && (
                <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 lg:grid-cols-8">
                  {media.map((m, i) => (
                    <button
                      key={m.kind === "video" ? `v-${m.id}` : m.url}
                      onClick={() => setSelectedImage(i)}
                      aria-label={m.kind === "video" ? "Vis trailer" : `Vis billede ${i + 1}`}
                      className={`relative aspect-video overflow-hidden rounded-lg border transition-colors duration-fast ${
                        i === selectedImage
                          ? "border-2 border-primary"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      {m.kind === "video" ? (
                        <>
                          <img
                            src={`https://i.ytimg.com/vi/${m.id}/mqdefault.jpg`}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-background/45">
                            <Play className="h-5 w-5 fill-foreground text-foreground" />
                          </span>
                        </>
                      ) : (
                        <Thumb src={m.thumb || m.url} fallback={m.url} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <section className="rounded-xl border border-border bg-card p-7">
            <h2 className="mb-4 text-[22px]">Sådan aktiverer du nøglen</h2>
            <ol className="grid gap-5 sm:grid-cols-3">
              {activationSteps.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="num flex-none font-bold text-primary">0{i + 1}</span>
                  <span className="text-[15px] leading-relaxed text-secondary-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* The Danish summary is generated from structured fields, so every
              product has one at no cost. Kinguin's own copy is English, and
              translating 43.9M characters of it would cost roughly EUR 880 —
              and again on every re-sync. It is kept, but shown as what it is:
              the supplier's text, in English, folded away by default. */}
          <section className="rounded-xl border border-border bg-card p-7">
            <h2 className="mb-4 text-[22px]">Om spillet</h2>
            <p className="max-w-[720px] text-base leading-relaxed text-secondary-foreground">
              {daSummary(product)}
            </p>

            {product.description && (
              <details className="group mt-5 border-t border-border pt-5">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-[15px] font-medium text-muted-foreground transition-colors duration-fast hover:text-foreground">
                  <ChevronRight className="h-4 w-4 transition-transform duration-fast group-open:rotate-90" />
                  Producentens beskrivelse (engelsk)
                </summary>
                <div
                  className="mt-4 max-w-[720px] text-base leading-relaxed text-secondary-foreground [&_a]:text-primary [&_img]:hidden"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </details>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-7">
            <h2 className="mb-5 text-[22px]">Produktdetaljer</h2>
            <dl className="flex flex-col">
              {details.map(([term, value], i) => (
                <div
                  key={term}
                  className={`grid grid-cols-[140px_1fr] py-3.5 text-[15px] sm:grid-cols-[220px_1fr] ${
                    i < details.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <dt className="text-muted-foreground">{term}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* Sticky buy column — the five questions, in order. */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <div>
            <h1 className="text-[32px] font-bold leading-tight tracking-tight" style={{ fontStretch: "100%" }}>
              {daProductName(product.name)}
            </h1>
            <div className="mt-3.5 flex flex-wrap gap-2">
              <span className="pill">{platform}</span>
              {region ? (
                <span className="pill pill-info">Region: {region}</span>
              ) : (
                <span className="pill">Region ikke oplyst</span>
              )}
              <span className="pill">Digital nøgle</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="num text-[44px] font-bold leading-none text-primary">
                {formatDKK(priceDKK)}
              </span>
              {discount > 0 && (
                <>
                  <span className="num text-lg text-muted-foreground/70 line-through">
                    {formatDKK(originalDKK)}
                  </span>
                  <span className="num rounded-md bg-destructive px-2.5 py-1 text-[13px] font-bold text-destructive-foreground">
                    −{discount}&nbsp;%
                  </span>
                </>
              )}
            </div>
            <p className="mt-2.5 text-sm text-muted-foreground">
              {/* formatDKK already ends in "kr." — a second full stop rendered
                  as "1 kr..". */}
              Inkl. moms {formatDKK(vatPortion)} Ingen gebyrer ved betaling.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <span
                className={`h-[7px] w-[7px] flex-none rounded-full ${
                  product.is_available ? "bg-primary" : "bg-muted-foreground"
                }`}
              />
              <span className="text-[15px] font-semibold">
                {product.is_available ? "På lager" : "Udsolgt"}
              </span>
              {product.is_available && (
                <span className="text-[15px] text-muted-foreground">· {DELIVERY_PROMISE.toLowerCase()}</span>
              )}
            </div>

            <Button
              size="lg"
              className="mt-5 w-full text-[17px]"
              onClick={handleBuyNow}
              disabled={!product.is_available}
            >
              Køb nu — {formatDKK(priceDKK)}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="mt-2.5 w-full"
              onClick={handleAddToCart}
              disabled={!product.is_available}
            >
              Læg i kurv
            </Button>

            <p className="mt-3.5 text-center text-[13px] text-muted-foreground">
              Nøglen sendes til din e-mail. Du kan altid finde den under Mine ordrer.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
            {[
              {
                title: "Officiel nøgle fra autoriseret forhandler",
                body: <>Aldrig genbrugte eller regionsomgåede nøgler.</>,
              },
              {
                title: "Virker nøglen ikke, får du en ny",
                body: (
                  <>
                    Skriv til support inden 14 dage. Vi svarer inden 24 timer og sender en ny nøgle
                    eller pengene tilbage.{" "}
                    <Link to="/support" className="text-primary">
                      Kontakt support
                    </Link>
                  </>
                ),
              },
              {
                title: "Betaling gennem Stripe",
                body: <>Visa, Mastercard, MobilePay, PayPal og Apple Pay.</>,
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] flex-none text-primary" />
                <div>
                  <p className="text-[15px] font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          {shardsEarned > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-club/20 bg-club/[0.08] px-4.5 py-4">
              <span className="text-sm text-secondary-foreground">Som medlem optjener du</span>
              <span className="num font-bold text-club">
                +{shardsEarned.toLocaleString("da-DK")} shards
              </span>
            </div>
          )}
        </aside>
      </main>

      <RecentlyViewed />
      <Footer />

      {/* The trailer is never the lightbox subject — it plays in place. */}
      {isLightboxOpen && current?.kind === "image" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card"
            aria-label="Luk"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={current.url}
            alt={product.name}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default ProductPage;
