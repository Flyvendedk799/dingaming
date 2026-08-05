import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchKinguinProductById, KinguinProduct } from "@/lib/kinguin";
import { usePricing } from "@/lib/pricing";
import { discountPercent as calcDiscount, regionLabel } from "@/lib/product";
import { useCartStore } from "@/stores/cartStore";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Gamepad2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import Header, { DELIVERY_PROMISE } from "@/components/Header";
import Footer from "@/components/Footer";
import RecentlyViewed from "@/components/RecentlyViewed";

const VAT_RATE = 0.25;

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-muted-foreground">Indlæser produkt …</span>
        </div>
      </div>
    );
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
  const platform = product.platform?.trim() || "Steam";
  const vatPortion = priceDKK * (VAT_RATE / (1 + VAT_RATE));
  const shardsEarned = Math.max(0, Math.round(priceDKK));
  const images = [product.cover_image, ...(product.screenshots || [])].filter(Boolean) as string[];

  const nextImage = () => setSelectedImage((p) => (p + 1) % images.length);
  const prevImage = () => setSelectedImage((p) => (p - 1 + images.length) % images.length);

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
    ...(product.genres?.length ? ([["Genrer", product.genres.join(", ")]] as Array<[string, string]>) : []),
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
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <main className="container mx-auto grid items-start gap-10 px-4 py-7 pb-16 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-6">
          {images.length > 0 && (
            <>
              <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="aspect-video w-full cursor-zoom-in object-cover"
                  onClick={() => setIsLightboxOpen(true)}
                />
                {images.length > 1 && (
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
                      {selectedImage + 1} / {images.length}
                    </span>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-6 gap-2.5">
                  {images.slice(0, 6).map((img, i) => (
                    <button
                      key={img}
                      onClick={() => setSelectedImage(i)}
                      className={`aspect-video overflow-hidden rounded-lg border transition-colors duration-fast ${
                        i === selectedImage ? "border-2 border-primary" : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
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

          {product.description && (
            <section className="rounded-xl border border-border bg-card p-7">
              <h2 className="mb-4 text-[22px]">Om spillet</h2>
              <div
                className="max-w-[720px] text-base leading-relaxed text-secondary-foreground [&_a]:text-primary [&_img]:hidden"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </section>
          )}

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
              {product.name}
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
              Inkl. moms {formatDKK(vatPortion)}. Ingen gebyrer ved betaling.
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

      {isLightboxOpen && images.length > 0 && (
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
            src={images[selectedImage]}
            alt={product.name}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default ProductPage;
