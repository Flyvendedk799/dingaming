import { useEffect, useState } from "react";
import WMark from "@/components/WMark";

const SESSION_KEY = "wgaming_intro_shown";
const DRAW_MS = 600; // matches --t-reward
const HOLD_MS = 120;
const FADE_MS = 240; // matches --t-base

/** Decided once, before first paint, so the site never flashes behind the overlay. */
export function shouldShowIntro(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === null;
  } catch {
    // Private mode with storage disabled — skip rather than replay every time.
    return false;
  }
}

interface BrandIntroProps {
  onDone: () => void;
}

/**
 * Brand moment: the mark draws itself, holds, and fades. Under a second.
 *
 * The version this replaces was a 685-line canvas piece with six phases,
 * running 6.2 seconds on desktop behind an opacity-0 site — and it replayed on
 * every visit more than 30 seconds apart, so a buyer returning from a price
 * comparison paid it again. This one runs once per tab session, uses the same
 * stroke-draw as the loading indicator, and is skipped entirely for anyone who
 * asked for reduced motion.
 */
const BrandIntro = ({ onDone }: BrandIntroProps) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* storage unavailable — the intro simply shows again next tab */
    }

    const fadeAt = window.setTimeout(() => setLeaving(true), DRAW_MS + HOLD_MS);
    const doneAt = window.setTimeout(onDone, DRAW_MS + HOLD_MS + FADE_MS);
    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(doneAt);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
      style={{
        opacity: leaving ? 0 : 1,
        transition: `opacity ${FADE_MS}ms var(--ease)`,
        pointerEvents: leaving ? "none" : "auto",
      }}
      aria-hidden="true"
    >
      <WMark size={96} motion="once" />
    </div>
  );
};

export default BrandIntro;
