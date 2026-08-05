interface LogoProps {
  /** Rendered size of the mark in px. */
  size?: number;
  /** Hide the wordmark and show only the mark (below ~120px of space). */
  markOnly?: boolean;
  className?: string;
}

/**
 * WGaming lockup.
 *
 * The mark is a single mitred stroke reading as a W. Rules from the identity
 * sheet: never gradient, glow or shadow it; never place it over a game cover;
 * one lime per lockup, so the wordmark stays foreground when the mark is lime.
 */
const Logo = ({ size = 32, markOnly = false, className = "" }: LogoProps) => (
  <span className={`flex items-center gap-2.5 ${className}`}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 88 88"
      className="block flex-none"
      aria-hidden="true"
    >
      <rect width="88" height="88" rx="20" fill="hsl(var(--primary))" />
      <path
        d="M17 27 L31 61 L44 38 L57 61 L71 27"
        fill="none"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="11"
        strokeLinejoin="miter"
      />
    </svg>
    {!markOnly && (
      <span
        className="font-extrabold leading-none text-foreground"
        style={{
          fontSize: size * 0.66,
          fontStretch: "112%",
          letterSpacing: "-0.02em",
        }}
      >
        WGAMING
      </span>
    )}
  </span>
);

export default Logo;
