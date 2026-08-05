/**
 * Danish product data without machine translation.
 *
 * The catalogue holds 43.9M characters of English description across the games
 * alone, which is roughly EUR 880 to push through a translation API once — and
 * again for every product Kinguin re-syncs. Almost none of that text is what a
 * customer actually reads before buying: they read the title, the platform, the
 * genres, the region and the price.
 *
 * So everything *structured* is translated here, for free and instantly, from
 * a closed vocabulary. The catalogue only uses 34 genres, 15 platforms and 2
 * regions in total, so a dictionary covers the whole catalogue with no gaps and
 * no per-product cost. The long English marketing copy stays English, clearly
 * labelled as the supplier's own text, under a Danish summary generated from
 * the structured fields.
 *
 * Game titles are deliberately NOT translated — they are proper nouns. Only the
 * boilerplate suffix ("... PC Steam CD Key") is rewritten, since that part is a
 * description of what you receive rather than part of the name.
 */

/** Every genre in the catalogue, by frequency. Unknown values pass through. */
const GENRES: Record<string, string> = {
  Action: "Action",
  Indie: "Indie",
  Adventure: "Eventyr",
  Simulation: "Simulation",
  Strategy: "Strategi",
  Casual: "Afslappet",
  RPG: "Rollespil",
  Racing: "Racing",
  "Co-op": "Co-op",
  Sport: "Sport",
  FPS: "FPS",
  "Story rich": "Historiedrevet",
  Horror: "Gyser",
  Puzzle: "Puslespil",
  Platformer: "Platformspil",
  "Open World": "Åben verden",
  Survival: "Overlevelse",
  Anime: "Anime",
  "Third-Person Shooter": "Tredjepersons shooter",
  Fighting: "Kampspil",
  "VR Games": "VR-spil",
  MMO: "MMO",
  "Visual Novel": "Visual novel",
  "Point & click": "Peg og klik",
  "Hack and Slash": "Hack and slash",
  "Music / Soundtrack": "Musik / soundtrack",
  "Life Simulation": "Livssimulation",
  "Adult Games": "Voksenspil",
  Software: "Software",
  "Hidden Object": "Skjulte genstande",
  "Dating Simulator": "Datingsimulator",
  "Random Keys": "Tilfældige nøgler",
  "XBOX LIVE Gold Card": "Xbox Live Gold-kort",
  Subscription: "Abonnement",
};

export const daGenre = (genre: string): string => GENRES[genre] ?? genre;

export const daGenres = (genres?: string[] | null): string[] => (genres ?? []).map(daGenre);

/** Only two region names exist in the catalogue. */
export const daRegion = (region?: string | null): string | null => {
  if (!region) return null;
  const key = region.trim().toLowerCase();
  if (key === "worldwide" || key === "global") return "Hele verden";
  if (key === "europe") return "Europa";
  return region;
};

/**
 * Platform names are proper nouns and stay as they are — the only fix is
 * Kinguin's shouty "XBOX", which is not how Microsoft writes it.
 */
export const daPlatform = (platform?: string | null): string =>
  (platform ?? "").replace(/\bXBOX\b/g, "Xbox").trim();

/**
 * Rewrites the trailing boilerplate on a product name.
 *
 * "Call of Duty 4: Modern Warfare (2007) PC Steam CD Key"
 *   -> "Call of Duty 4: Modern Warfare (2007) PC Steam-nøgle"
 *
 * Danish compounds a noun onto a proper noun with a hyphen, so "Steam-nøgle"
 * and "PS5-konto" are the correct forms. The title itself is untouched.
 */
export const daProductName = (name: string): string =>
  name
    .replace(/\bXBOX\b/g, "Xbox")
    .replace(/\s*\bCD\s*Keys?\s*$/i, "-nøgle")
    .replace(/\s*\bKeys?\s*$/i, "-nøgle")
    .replace(/\s*\bAccounts?\s*$/i, "-konto")
    .replace(/\s*\bGift\s*Card\s*$/i, "-gavekort")
    .replace(/\s*\bSubscription\s*$/i, "-abonnement")
    .replace(/\s{2,}/g, " ")
    .trim();

const LANGUAGES: Record<string, string> = {
  English: "Engelsk",
  Danish: "Dansk",
  German: "Tysk",
  French: "Fransk",
  Spanish: "Spansk",
  Italian: "Italiensk",
  Polish: "Polsk",
  Portuguese: "Portugisisk",
  Russian: "Russisk",
  Japanese: "Japansk",
  Korean: "Koreansk",
  Chinese: "Kinesisk",
  Dutch: "Hollandsk",
  Swedish: "Svensk",
  Norwegian: "Norsk",
  Finnish: "Finsk",
  Czech: "Tjekkisk",
  Turkish: "Tyrkisk",
  Arabic: "Arabisk",
  Hungarian: "Ungarsk",
  Greek: "Græsk",
  Romanian: "Rumænsk",
  Ukrainian: "Ukrainsk",
  Thai: "Thai",
  Vietnamese: "Vietnamesisk",
};

export const daLanguage = (language: string): string => LANGUAGES[language] ?? language;

/**
 * Strips the trailing "what you receive" boilerplate to leave the bare title.
 *
 * "Mass Effect 2 EA App CD Key"                       -> "Mass Effect 2"
 * "Call of Duty 4: Modern Warfare (2007) PC Steam CD Key"
 *                                                     -> "Call of Duty 4: Modern Warfare (2007)"
 * "Marvel's Spider-Man Remastered EU PS5 CD Key"      -> "Marvel's Spider-Man Remastered"
 *
 * Used for the generated summary, where repeating "... CD Key leveres som en
 * digital nøgle til ..." reads as a stutter.
 */
const TRAILING_BOILERPLATE = new RegExp(
  "\\s*(?:EU|US|EN|ROW|Global|Worldwide)?" +
    "\\s*(?:PC|XBOX|Xbox|PSN|PS4|PS5|PS3|Nintendo|Switch)?" +
    "\\s*(?:Steam|Epic\\s*Games|Epic|GOG(?:\\.com)?|EA\\s*App|Origin|" +
    "Ubisoft(?:\\s*Connect)?|Battle\\.net|Rockstar|Microsoft|Xbox\\s*Live)?" +
    "\\s*(?:CD\\s*Keys?|Keys?|Accounts?|Altergift|Gift\\s*Card|Subscription)\\s*$",
  "i",
);

export const daBaseTitle = (name: string): string =>
  name.replace(TRAILING_BOILERPLATE, "").trim() || name;

/** Joins with a Danish "og" rather than a trailing comma. */
export const daList = (items: string[]): string => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} og ${items[items.length - 1]}`;
};

export const daMonthYear = (date?: string | null): string | null => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("da-DK", { year: "numeric", month: "long" });
};

/**
 * A Danish product summary assembled from structured fields.
 *
 * This is what a Danish customer reads first. It is generated, so it is
 * available for all 29,517 games at no cost and never drifts out of sync with
 * the catalogue — unlike a translated blob, which would have to be re-run every
 * time Kinguin touches the product.
 */
export const daSummary = (product: {
  name: string;
  platform?: string | null;
  genres?: string[] | null;
  region_name?: string | null;
  release_date?: string | null;
}): string => {
  const title = daBaseTitle(product.name);
  const platform = daPlatform(product.platform) || "din platform";
  const genres = daGenres(product.genres).slice(0, 3);
  const region = daRegion(product.region_name);
  const released = daMonthYear(product.release_date);

  const sentences = [
    `${title} leveres som en digital nøgle til ${platform}.`,
    genres.length ? `Genrer: ${daList(genres)}.` : "",
    released ? `Udgivet ${released}.` : "",
    region === "Hele verden"
      ? "Nøglen kan indløses i hele verden."
      : region === "Europa"
        ? "Nøglen kan kun indløses i Europa."
        : "",
  ];

  return sentences.filter(Boolean).join(" ");
};
