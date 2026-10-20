// =============================================================================
// Phone-size check - Replit template (not used by our pages)
// =============================================================================
// WHAT IT DOES
//   useIsMobile() says whether the window is narrower than 768px.
//
// HOW IT CONNECTS
//   - Came with Replit's UI kit (components/ui/). Our pages use CSS media queries instead.
//
// CREDIT
//   Replit's React template (came with the project; not written by the team).
// =============================================================================

import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
