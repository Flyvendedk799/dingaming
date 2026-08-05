import { useEffect } from "react";

export const SITE_NAME = "WGaming";
export const SITE_URL = "https://wgaming.dk";

/**
 * Per-route document metadata for a single-page app.
 *
 * The whole site shipped one static <title> and one description, so every one
 * of the 26 routes looked identical to a crawler and to anyone sharing a link.
 * There is no server rendering here, so this sets the tags on the document
 * after mount — Google executes JS and will pick them up, but it is worth
 * knowing that is the mechanism if crawling ever looks off.
 *
 * Anything set here is reverted on unmount so a route never inherits the
 * previous page's canonical or Open Graph image.
 */

interface SeoInput {
  /** Page title without the site suffix; omit for the home page. */
  title?: string;
  description?: string;
  /** Path only, e.g. "/product/123". Combined with SITE_URL. */
  path?: string;
  image?: string;
  /** "website" | "product" */
  type?: string;
  /** Keep this page out of the index (thin, private or duplicate). */
  noindex?: boolean;
  /** JSON-LD objects to attach for this page. */
  jsonLd?: Array<Record<string, unknown>>;
}

const MANAGED = "data-seo-managed";

function upsertMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.setAttribute(MANAGED, "1");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    el.setAttribute(MANAGED, "1");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSeo(input: SeoInput) {
  const { title, description, path, image, type = "website", noindex = false, jsonLd } = input;

  // Serialised so a caller can build the object inline without re-running the
  // effect on every render.
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const previousTitle = document.title;

    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Køb spil — nøglen på e-mail inden for 60 sekunder`;
    document.title = fullTitle;

    const url = `${SITE_URL}${path ?? window.location.pathname}`;
    upsertLink("canonical", url);
    upsertMeta('meta[property="og:url"]', "property", "og:url", url);
    upsertMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    upsertMeta('meta[property="og:type"]', "property", "og:type", type);
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);

    if (description) {
      upsertMeta('meta[name="description"]', "name", "description", description);
      upsertMeta('meta[property="og:description"]', "property", "og:description", description);
      upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    }

    if (image) {
      upsertMeta('meta[property="og:image"]', "property", "og:image", image);
      upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    }

    // Robots meta rather than robots.txt, because a disallowed URL can still
    // be indexed from an inbound link — noindex is what actually removes it.
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (noindex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        robots.setAttribute(MANAGED, "1");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex, follow");
    } else if (robots?.getAttribute(MANAGED)) {
      robots.remove();
    }

    const scripts: HTMLScriptElement[] = [];
    if (jsonLd?.length) {
      for (const block of jsonLd) {
        const s = document.createElement("script");
        s.type = "application/ld+json";
        s.setAttribute(MANAGED, "1");
        s.textContent = JSON.stringify(block);
        document.head.appendChild(s);
        scripts.push(s);
      }
    }

    return () => {
      document.title = previousTitle;
      scripts.forEach((s) => s.remove());
      const r = document.head.querySelector<HTMLMetaElement>(`meta[name="robots"][${MANAGED}]`);
      r?.remove();
    };
  }, [title, description, path, image, type, noindex, jsonLdKey]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Breadcrumbs in the shape Google expects. */
export function breadcrumbLd(trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: `${SITE_URL}${step.path}`,
    })),
  };
}

interface ProductLdInput {
  name: string;
  description?: string | null;
  image?: string | null;
  sku: string | number;
  platform?: string | null;
  priceDkk: number;
  inStock: boolean;
  url: string;
}

/**
 * Product structured data.
 *
 * Deliberately omits aggregateRating and review: the site has no verified
 * purchase reviews, and inventing them is what the fabricated 4.5-5.0 star
 * ratings did before they were removed. Marking up ratings that do not exist
 * is also a manual-action risk, not just a taste problem.
 */
export function productLd(p: ProductLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    ...(p.description ? { description: p.description.replace(/<[^>]*>/g, "").slice(0, 500) } : {}),
    ...(p.image ? { image: [p.image] } : {}),
    sku: String(p.sku),
    ...(p.platform ? { brand: { "@type": "Brand", name: p.platform } } : {}),
    offers: {
      "@type": "Offer",
      url: p.url,
      priceCurrency: "DKK",
      price: p.priceDkk.toFixed(2),
      availability: p.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };
}
