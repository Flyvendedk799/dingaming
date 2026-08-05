import { KinguinProduct } from "@/lib/kinguin";

/**
 * Region shown to the customer, in Danish — or null when we do not actually
 * know it.
 *
 * The old rule was `region_name || (region_id === 3 ? 'Worldwide' : 'Europe')`,
 * which quietly asserted "Europe" for every product whose region was simply
 * missing. Telling someone a key works in their country when nobody checked is
 * the one claim on this page that costs a refund, so an unknown region now
 * reads as unknown.
 */
export function regionLabel(product: Pick<KinguinProduct, "region_name" | "region_id">): string | null {
  const raw = product.region_name?.trim();

  if (raw) {
    const normalised = raw.toLowerCase();
    if (normalised.includes("worldwide") || normalised.includes("region free")) return "Global";
    if (normalised.includes("europe")) return "Europa";
    return raw;
  }

  // Only these two IDs are documented well enough to state as fact.
  if (product.region_id === 3) return "Global";
  if (product.region_id === 1) return "Europa";
  return null;
}

/** "Steam · Europa", or just "Steam" when the region is unknown. */
export function platformAndRegion(
  product: Pick<KinguinProduct, "platform" | "region_name" | "region_id">,
): string {
  const platform = product.platform?.trim() || "Steam";
  const region = regionLabel(product);
  return region ? `${platform} · ${region}` : platform;
}

/** Whole-percent discount, or 0 when there is no genuine saving. */
export function discountPercent(
  product: Pick<KinguinProduct, "original_price" | "sell_price">,
): number {
  if (!product.original_price || product.original_price <= product.sell_price) return 0;
  return Math.round((1 - product.sell_price / product.original_price) * 100);
}
