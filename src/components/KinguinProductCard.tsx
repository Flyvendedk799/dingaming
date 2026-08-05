import { useState } from "react";
import { Check, Eye, Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KinguinProduct } from "@/lib/kinguin";
import { usePricing } from "@/lib/pricing";
import { discountPercent, platformAndRegion } from "@/lib/product";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface KinguinProductCardProps {
  product: KinguinProduct;
  index?: number;
  onQuickView?: (product: KinguinProduct) => void;
}

/**
 * Product card.
 *
 * The cover used to carry four badges — platform, region, discount and stock —
 * two of which were positioned on top of each other. Now it carries at most
 * one: the discount. Platform and region moved above the title as a label,
 * where they read as information rather than decoration.
 *
 * The buy button is deliberately an outline: a grid of eight lime buttons
 * would break the rule that one screen gets one lime button.
 */
const KinguinProductCard = ({ product, onQuickView }: KinguinProductCardProps) => {
  const [justAdded, setJustAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const { getPrice, formatDKK, loading } = usePricing();

  const priceInDkk = getPrice(product.sell_price, product.margin_percent);
  const originalPriceInDkk = getPrice(product.original_price, product.margin_percent);
  const discount = discountPercent(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.is_available) {
      toast.error("Udsolgt", { description: "Dette produkt kan ikke købes lige nu." });
      return;
    }

    addItem({
      variantId: `kinguin-${product.kinguin_id}`,
      kinguinId: product.kinguin_id,
      title: product.name,
      quantity: 1,
      price: { amount: String(priceInDkk), currencyCode: "DKK" },
      originalAmount: discount > 0 ? String(originalPriceInDkk) : undefined,
      image: product.cover_image || undefined,
      sku: `KINGUIN-${product.kinguin_id}`,
    });

    setJustAdded(true);
    toast.success(`${product.name} lagt i kurven`);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? "Fjernet fra ønskelisten" : "Tilføjet til ønskelisten");
  };

  return (
    <Link
      to={`/product/${product.kinguin_id}`}
      className="game-card group flex h-full flex-col"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={product.cover_image || "/placeholder.svg"}
          alt={product.name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
          }}
        />

        {/* The only badge allowed over a cover. */}
        {discount > 0 && (
          <span className="num absolute left-2.5 top-2.5 rounded-md bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">
            −{discount}&nbsp;%
          </span>
        )}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-fast group-hover:pointer-events-auto group-hover:opacity-100">
          {onQuickView && (
            <button
              onClick={handleQuickView}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/90 backdrop-blur-sm transition-colors duration-fast hover:bg-background"
              aria-label="Hurtigt kig"
            >
              <Eye className="h-5 w-5 text-foreground" />
            </button>
          )}
          <button
            onClick={handleWishlist}
            className={`flex h-11 w-11 items-center justify-center rounded-full border border-border backdrop-blur-sm transition-colors duration-fast ${
              isWishlisted
                ? "bg-destructive text-destructive-foreground"
                : "bg-background/90 hover:bg-background"
            }`}
            aria-label={isWishlisted ? "Fjern fra ønskeliste" : "Tilføj til ønskeliste"}
          >
            <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="label-eyebrow text-muted-foreground">{platformAndRegion(product)}</p>

        <h3 className="mb-auto mt-1.5 line-clamp-2 font-semibold leading-snug text-foreground">
          {product.name}
        </h3>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="flex flex-col">
            <span className="num text-xl font-bold leading-tight text-primary">
              {loading ? "—" : formatDKK(priceInDkk)}
            </span>
            {discount > 0 && (
              <span className="num text-[13px] text-muted-foreground/70 line-through">
                {loading ? "" : formatDKK(originalPriceInDkk)}
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.is_available}
            className="shrink-0"
          >
            {justAdded ? (
              <>
                <Check className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Lagt i</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                <span className="ml-1">Køb</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default KinguinProductCard;
