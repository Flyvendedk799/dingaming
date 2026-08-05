import { useEffect, useState } from "react";
import WMark from "@/components/WMark";
import { DELIVERY_PROMISE } from "@/components/Header";

const SESSION_KEY = "wgaming_intro_shown";

const DRAW_MS = 600; // --t-reward: the mark drawing itself
const WORDMARK_DELAY = 280;
const TAGLINE_DELAY = 460;
const RISE_MS = 240; // --t-base
const SETTLED = Math.max(DRAW_MS, TAGLINE_DELAY + RISE_MS);
const HOLD_MS = 260;
const FADE_MS = 240;
const TOTAL = SETTLED + HOLD_MS + FADE_MS; // ~1.2s

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
 * Brand moment: the mark draws, the wordmark and tagline rise behind it, then
 * the whole thing lifts. About 1.2 seconds.
 *
 * The version this replaces was 685 lines of canvas across six phases, 6.2
 * seconds on desktop behind an opacity-0 site, replayed on every visit more
 * than 30 seconds apart — so a buyer returning from a price comparison paid
 * for it again. This one runs once per tab session, reuses the same
 * stroke-draw as the loading indicator, renders over an already-painted page,
 * and is skipped entirely for anyone who asked for reduced motion.
 *
 * The tagline is the delivery promise verbatim, not a fifth variation of it.
 */
const BrandIntro = ({ onDone }: BrandIntroProps) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* storage unavailable — the intro simply shows again next tab */
    }

    const fadeAt = window.setTimeout(() => setLeaving(true), SETTLED + HOLD_MS);
    const doneAt = window.setTimeout(onDone, TOTAL);
    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(doneAt);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background px-6"
      style={{
        opacity: leaving ? 0 : 1,
        transition: `opacity ${FADE_MS}ms var(--ease)`,
        pointerEvents: leaving ? "none" : "auto",
      }}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center">
        {/* The lockup: one lime per lockup, so the mark is lime and the
            wordmark stays foreground. */}
        <div className="flex items-center gap-4">
          <WMark size={64} motion="once" />
          <span
            className="intro-rise text-[44px] font-extrabold leading-none text-foreground sm:text-[56px]"
            style={{
              fontStretch: "125%",
              letterSpacing: "-0.03em",
              animationDelay: `${WORDMARK_DELAY}ms`,
            }}
          >
            WGAMING
          </span>
        </div>

        <p
          className="intro-rise mt-6 text-center text-base text-muted-foreground sm:text-lg"
          style={{ animationDelay: `${TAGLINE_DELAY}ms` }}
        >
          {DELIVERY_PROMISE}
        </p>
      </div>
    </div>
  );
};

export default BrandIntro;
