import WMark from "@/components/WMark";

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
    <WMark size={size} />
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
