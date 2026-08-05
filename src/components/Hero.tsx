import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Gamepad,
  Gamepad2,
  Headphones,
  Joystick,
  Monitor,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchKinguinProducts } from "@/lib/kinguin";
import { usePricing } from "@/lib/pricing";
import { discountPercent, platformAndRegion } from "@/lib/product";
import { daProductName } from "@/lib/da";
import { DELIVERY_PROMISE } from "@/components/Header";

/**
 * Hero.
 *
 * The featured product carries the page: it takes the wider column with cover
 * art at real size and the screen's single lime button. A shop's landing
 * should lead with something you can buy, not a slogan.
 *
 * The left column is filled to match that card's height — headline, then the
 * four platform entry points, then the trust row. Previously it was a headline
 * and two buttons beside a 600px card, which left most of the column empty.
 *
 * Gone from the original: thirty drifting particles, three mouse-parallax
 * orbs, four floating covers, a grid overlay, a countdown that reset to
 * 23:59:59 on every reload, and a featured deal for a game that was not in the
 * catalogue.
 */

/**
 * Matches the families on the category page so the links land on real filters.
 *
 * Each platform carries its own colour. The tints are lightened from the
 * official brand values, which are all mixed for contrast on charcoal —
 * PlayStation #0070D1 and Xbox #107C10 both fail against this background.
 * Classes are written out in full rather than composed, or Tailwind's scanner
 * would not emit them.
 */
const PLATFORMS = [
  {
    label: "PC",
    family: "PC",
    icon: Monitor,
    tint: "text-foreground",
    hover: "hover:border-foreground/35",
  },
  {
    label: "PlayStation",
    family: "PlayStation",
    icon: Gamepad2,
    tint: "text-[#4C9BE8]",
    hover: "hover:border-[#4C9BE8]/55",
  },
  {
    label: "Xbox",
    family: "Xbox",
    icon: Gamepad,
    tint: "text-[#57B94A]",
    hover: "hover:border-[#57B94A]/55",
  },
  {
    label: "Switch",
    family: "Nintendo",
    icon: Joystick,
    tint: "text-[#E8434F]",
    hover: "hover:border-[#E8434F]/55",
  },
];

/** One at a time, arrows to move between them. */
const SLIDE_COUNT = 5;

const TRUST = [
  { icon: ShieldCheck, title: "Officielle nøgler", body: "Fra autoriserede forhandlere" },
  { icon: Zap, title: "Levering på 60 sek.", body: "Direkte på din e-mail" },
  { icon: Headphones, title: "Dansk support", body: "Svar inden 24 timer" },
];

const Hero = () => {
  const { getPrice, formatDKK } = usePricing();

  const { data: slides = [] } = useQuery({
    queryKey: ["hero-featured", SLIDE_COUNT],
    queryFn: async () => {
      const products = await fetchKinguinProducts(24, undefined, {
        requireCoverImage: true,
        gamesOnly: true,
        order: "stocked",
        priceRange: { min: 8, max: 80 },
      });
      return products
        .map((product) => ({ product, discount: discountPercent(product) }))
        .sort((a, b) => b.discount - a.discount)
        .slice(0, SLIDE_COUNT);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: counts } = useQuery({
    queryKey: ["hero-platform-counts"],
    queryFn: async () => {
      const patterns: Record<string, string[]> = {
        PC: ["Steam", "Epic", "GOG", "EA App", "Ubisoft"],
        PlayStation: ["PlayStation"],
        Xbox: ["Xbox"],
        Nintendo: ["Nintendo"],
      };
      const entries = await Promise.all(
        Object.entries(patterns).map(async ([family, matches]) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const q: any = supabase
            .from("kinguin_products")
            .select("kinguin_id", { count: "exact", head: true });
          const { count } = await q
            .eq("is_available", true)
            .eq("is_game", true)
            .or(matches.map((m) => `platform.ilike.*${m}*`).join(","));
          return [family, (count as number) ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
    staleTime: 30 * 60 * 1000,
  });

  const [index, setIndex] = useState(0);
  // The query resolves after the first render, so the index has to survive a
  // list that grows from 0 to 5 underneath it.
  const count = slides.length;
  const active = count ? index % count : 0;
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  // Only the visible slide is in the DOM — five 540KB covers mounted at once
  // would compete with the LCP image. Neighbours are warmed in the cache
  // instead, so an arrow press paints from memory rather than the network.
  useEffect(() => {
    if (count < 2) return;
    for (const delta of [1, -1]) {
      const url = slides[(active + delta + count) % count]?.product?.cover_image;
      if (url) new Image().src = url;
    }
  }, [active, count, slides]);

  const slide = slides[active];
  const product = slide?.product;
  const discount = slide?.discount ?? 0;
  const price = product ? getPrice(product.sell_price, product.margin_percent) : 0;
  const was = product ? getPrice(product.original_price, product.margin_percent) : 0;

  return (
    <section className="border-b border-border">
      {/* items-stretch, not items-start: the two columns share a grid row, so
          stretching makes them exactly equal height and gives the left column
          slack to distribute. With items-start each column sized to its own
          content and the shorter one simply ended early. */}
      <div className="container mx-auto grid items-stretch gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,480px)] lg:gap-12 lg:py-12">
        <div className="flex flex-col">
          {/* Breaks are explicit rather than left to the wrap: the column is
              840px at 1440 but 464px at 1024, so a natural wrap dropped
              "sekunder." onto a line by itself. text-wrap:balance does not
              rescue it — the forced break splits the block first. Every line
              below fits the narrowest column, so the shape holds throughout. */}
          <h1 className="text-display text-[34px] sm:text-[42px] lg:text-[48px]">
            Køb spillet.
            <br />
            Få nøglen inden
            <br />
            for 60 sekunder.
          </h1>
          {/* Narrow enough that the wrap falls between the two sentences at
              every column width, rather than mid-phrase on "Priser inkl. moms". */}
          <p className="mt-4 max-w-[420px] text-base leading-relaxed text-muted-foreground">
            Officielle nøgler til Steam, PlayStation, Xbox og Nintendo. Priser inkl. moms — ingen
            gebyrer ved betaling.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="lg" className="h-12 px-7 text-[15px]">
              <Link to="/search">Se alle spil</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="h-12 px-6 text-[15px] text-muted-foreground"
            >
              <Link to="/deals">Tilbud</Link>
            </Button>
          </div>

          {/* Four ways into the catalogue, straight from the fold. `grow`
              absorbs the column's leftover height into the tiles — they are
              the clickable part, so height is presence rather than padding —
              and the max caps them before they turn into slabs. Whatever the
              cap leaves over goes to the trust row's mt-auto, which pins it
              level with the bottom of the card. */}
          <div className="mt-7 grid grow grid-cols-1 gap-3 sm:grid-cols-2 lg:max-h-[240px]">
            {PLATFORMS.map(({ label, family, icon: Icon, tint, hover }) => (
              <Link
                key={label}
                to={`/categories?platform=${encodeURIComponent(family)}`}
                className={`game-card group flex min-h-[76px] items-center gap-4 px-5 py-4 ${hover}`}
              >
                <Icon className={`h-8 w-8 flex-none ${tint}`} strokeWidth={1.5} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold leading-tight">{label}</span>
                  <span className="num mt-0.5 block text-[13px] text-muted-foreground">
                    {counts?.[family] !== undefined
                      ? `${counts[family].toLocaleString("da-DK")} spil`
                      : "—"}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 flex-none text-muted-foreground transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            ))}
          </div>

          <div className="mt-auto grid gap-4 pt-6 sm:grid-cols-3">
            {TRUST.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 h-[18px] w-[18px] flex-none text-primary" />
                <div>
                  <p className="text-sm font-semibold leading-tight">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {product && (
          <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            {/* The arrows sit outside the product link — nesting buttons inside
                an anchor is invalid and makes the whole image un-clickable on
                keyboard. Hence two sibling links rather than one wrapping both. */}
            <div className="relative">
              <Link to={`/product/${product.kinguin_id}`} className="group block">
                {/* Source art is 8:7; 4:3 widens it into a hero shape while
                    trimming only ~7% from top and bottom, centred. */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    key={product.kinguin_id}
                    src={product.cover_image || "/placeholder.svg"}
                    alt={product.name}
                    className="h-full w-full animate-in fade-in-0 object-cover object-center duration-[240ms]"
                    // Largest element above the fold, so it is the page's LCP.
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
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
              </Link>

              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Forrige spil"
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur transition-colors duration-fast hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Næste spil"
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur transition-colors duration-fast hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
                    {slides.map((s, i) => (
                      <button
                        key={s.product.kinguin_id}
                        type="button"
                        onClick={() => setIndex(i)}
                        aria-label={`Vis spil ${i + 1} af ${count}`}
                        aria-current={i === active}
                        className={`h-1.5 rounded-full transition-all duration-fast ${
                          i === active
                            ? "w-5 bg-primary"
                            : "w-1.5 bg-foreground/35 hover:bg-foreground/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <Link to={`/product/${product.kinguin_id}`} className="group block">
              <div className="px-5 pt-5">
                <p className="label-eyebrow text-muted-foreground">{platformAndRegion(product)}</p>
                {/* Two lines' worth of height is reserved whether the title
                    needs it or not — otherwise the card resizes as you page
                    through, and the whole grid row jumps with it. */}
                <h2 className="mt-2 line-clamp-2 min-h-[55px] text-[22px] font-bold leading-tight tracking-tight transition-colors duration-fast group-hover:text-primary">
                  {daProductName(product.name)}
                </h2>
                <div className="mt-3 flex flex-wrap items-baseline gap-3">
                  <span className="num text-[34px] font-bold leading-none text-primary">
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

            {/* mt-auto so the buy button sits on the card's bottom edge if the
                left column is ever the taller of the two. */}
            <div className="mt-auto p-5 pt-4">
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
