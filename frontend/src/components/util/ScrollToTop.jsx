import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// In an SPA the scroll position is kept across route changes. This resets it to
// the top on every navigation — except when the URL has a hash (e.g.
// /services#property-sales), where we let the browser scroll to that anchor.
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

export default ScrollToTop;
