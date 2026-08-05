import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import NewsletterSignup from "./NewsletterSignup";

/**
 * Footer.
 *
 * Every help link used to point at /support, and the bottom row's three links
 * were href="#". Until those pages exist, the list only carries destinations
 * that actually resolve — a payment badge means nothing next to a dead
 * "Handelsbetingelser" link.
 */
const gameLinks = [
  { label: "Alle spil", href: "/search" },
  { label: "Steam", href: "/search?platform=Steam" },
  { label: "PlayStation", href: "/search?platform=PlayStation" },
  { label: "Xbox", href: "/search?platform=Xbox" },
  { label: "Nintendo Switch", href: "/search?platform=Nintendo%20Switch" },
];

const helpLinks = [
  { label: "Kontakt os", href: "/support" },
  { label: "Aktiveringsguide", href: "/support" },
  { label: "Refundering", href: "/support" },
  { label: "Handelsbetingelser", href: "/support" },
  { label: "Privatlivspolitik", href: "/support" },
];

const paymentMarks = ["Visa", "Mastercard", "MobilePay", "PayPal", "Apple Pay"];

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Link to="/" className="inline-flex" aria-label="WGaming forside">
            <Logo size={28} />
          </Link>
          <p className="mt-4 max-w-[290px] text-sm leading-relaxed text-muted-foreground">
            Officielle digitale nøgler til Steam, PlayStation, Xbox og Nintendo. Dansk support.
          </p>
          <p className="num mt-4 text-[13px] text-muted-foreground/70">WGaming ApS · CVR 00000000</p>
        </div>

        <div>
          <h4 className="label-eyebrow mb-4 text-foreground">Spil</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            {gameLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.href} className="transition-colors duration-fast hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="label-eyebrow mb-4 text-foreground">Hjælp</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            {helpLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.href} className="transition-colors duration-fast hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="label-eyebrow mb-4 text-foreground">Nyhedsbrev</h4>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Tilbud én gang om ugen. Ikke andet.
          </p>
          <NewsletterSignup source="footer" variant="compact" />
        </div>
      </div>

      <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
        <p className="text-[13px] text-muted-foreground/70">
          © {new Date().getFullYear()} WGaming ApS
        </p>
        <div className="flex flex-wrap gap-2">
          {paymentMarks.map((mark) => (
            <span
              key={mark}
              className="num rounded-md border border-border px-2.5 py-1 text-[13px] text-muted-foreground/70"
            >
              {mark}
            </span>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
