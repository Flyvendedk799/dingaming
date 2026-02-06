import * as React from "react";

const MOBILE_BREAKPOINT = 768;

// Safe initialization that works on both server and client
function getInitialMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile() {
  // Initialize immediately from window.innerWidth to avoid layout flash
  const [isMobile, setIsMobile] = React.useState<boolean>(getInitialMobile);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    // Sync in case initial value was wrong (SSR scenario)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
