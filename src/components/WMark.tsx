interface WMarkProps {
  /** Rendered size in px. */
  size?: number;
  /**
   * "still"  — plain mark, for the logo lockup.
   * "loop"   — the stroke draws and unwinds forever; this is the loading state.
   * "once"   — the stroke draws a single time and stays; used by the intro.
   */
  motion?: "still" | "loop" | "once";
  /** Draw the rounded lime tile behind the stroke. */
  tile?: boolean;
  className?: string;
  /** Accessible label; omit to mark the SVG decorative. */
  label?: string;
}

/**
 * The WGaming mark.
 *
 * The stroke is one continuous polyline roughly 126 units long, which is why
 * it makes a good loading indicator: dashing it and running the offset from
 * 126 to -126 draws the W and then unwinds it, so the brand and the spinner
 * are the same gesture rather than a logo plus an unrelated circle.
 */
const WMark = ({ size = 32, motion = "still", tile = true, className = "", label }: WMarkProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 88 88"
    className={`block flex-none ${className}`}
    role={label ? "img" : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
  >
    {tile && <rect width="88" height="88" rx="20" fill="hsl(var(--primary))" />}
    <path
      d="M17 27 L31 61 L44 38 L57 61 L71 27"
      fill="none"
      stroke={tile ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))"}
      strokeWidth="11"
      strokeLinejoin="miter"
      className={motion === "loop" ? "w-stroke-loop" : motion === "once" ? "w-stroke-once" : undefined}
    />
  </svg>
);

export default WMark;
