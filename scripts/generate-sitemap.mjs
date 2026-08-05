/**
 * Build the sitemap from the live catalogue.
 *
 * Runs after `vite build`, writing into dist/. A single sitemap tops out at
 * 50,000 URLs and the catalogue is already past 31,000, so this emits an index
 * plus paginated child files — which is also what keeps each file under the
 * 50 MB limit.
 *
 * It must never fail the build. A deploy that cannot reach the database should
 * still ship the site; a missing sitemap costs some crawl efficiency, a failed
 * deploy costs the whole shop.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE = process.env.SITE_URL || "https://wgaming.dk";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
const ANON = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const OUT = join(process.cwd(), "dist");
const PER_FILE = 20000;

/** Routes worth crawling. Account, checkout and admin are excluded by robots.txt. */
const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/categories", priority: "0.9", changefreq: "daily" },
  { path: "/deals", priority: "0.8", changefreq: "daily" },
  { path: "/support", priority: "0.5", changefreq: "monthly" },
  { path: "/club", priority: "0.4", changefreq: "monthly" },
];

const xmlEscape = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

function urlset(entries) {
  const body = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${xmlEscape(SITE + e.path)}</loc>\n` +
        (e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>\n` : "") +
        (e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>\n` : "") +
        (e.priority ? `    <priority>${e.priority}</priority>\n` : "") +
        `  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function sitemapIndex(files) {
  const now = new Date().toISOString();
  const body = files
    .map((f) => `  <sitemap>\n    <loc>${xmlEscape(`${SITE}/${f}`)}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

async function fetchProducts() {
  if (!ANON) {
    console.warn("[sitemap] no anon key in env — writing static routes only");
    return [];
  }

  const products = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    // Every buyable product, including the ~2,000 with no cover art. Those are
    // hidden from the home page because a grid of blank tiles looks broken,
    // but the pages themselves are complete — title, price, region,
    // activation steps — and they are exactly the long-tail titles someone
    // searches for by name.
    const url =
      `${SUPABASE_URL}/rest/v1/kinguin_products` +
      `?select=kinguin_id,updated_at&is_available=eq.true` +
      `&order=kinguin_id.asc&limit=${pageSize}&offset=${from}`;

    const res = await fetch(url, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    });
    if (!res.ok) throw new Error(`REST ${res.status}`);

    const batch = await res.json();
    products.push(...batch);
    if (batch.length < pageSize) break;
    // Guard against an unbounded loop if the API ever misbehaves.
    if (products.length > 200000) break;
  }
  return products;
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  let products = [];
  try {
    products = await fetchProducts();
    console.log(`[sitemap] ${products.length} products`);
  } catch (err) {
    console.warn(`[sitemap] catalogue unreachable (${err.message}) — static routes only`);
  }

  const files = [];

  writeFileSync(join(OUT, "sitemap-pages.xml"), urlset(STATIC_ROUTES), "utf8");
  files.push("sitemap-pages.xml");

  for (let i = 0; i * PER_FILE < products.length; i++) {
    const slice = products.slice(i * PER_FILE, (i + 1) * PER_FILE);
    const entries = slice.map((p) => ({
      path: `/product/${p.kinguin_id}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
      changefreq: "weekly",
      priority: "0.7",
    }));
    const name = `sitemap-products-${i + 1}.xml`;
    writeFileSync(join(OUT, name), urlset(entries), "utf8");
    files.push(name);
  }

  writeFileSync(join(OUT, "sitemap.xml"), sitemapIndex(files), "utf8");
  console.log(`[sitemap] wrote ${files.length} file(s): ${files.join(", ")}`);
}

main().catch((err) => {
  // Never break the deploy over a sitemap.
  console.warn(`[sitemap] skipped: ${err.message}`);
});
