import WMark from "@/components/WMark";

interface WLoaderProps {
  size?: number;
  /** Optional line under the mark, e.g. "Indlæser produkt". */
  label?: string;
  /** Fill the viewport rather than sitting in the flow. */
  fullscreen?: boolean;
  className?: string;
}

/**
 * The app's loading indicator: the WGaming mark drawing itself.
 *
 * Replaces the generic spinner on anything page- or section-sized. Small
 * in-button spinners keep their icon — the mark's stroke is not legible at
 * 16px, and a loader you cannot read is just noise.
 */
const WLoader = ({ size = 48, label, fullscreen = false, className = "" }: WLoaderProps) => {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <WMark size={size} motion="loop" label={label ?? "Indlæser"} />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">{content}</div>
    );
  }
  return <div className="flex items-center justify-center py-20">{content}</div>;
};

export default WLoader;
