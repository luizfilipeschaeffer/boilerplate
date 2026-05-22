import * as React from "react";

const LG_BREAKPOINT = 1024;

export function useIsLg() {
  const [isLg, setIsLg] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
    const onChange = () => setIsLg(mql.matches);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isLg;
}
