import { useEffect, useState } from "react";
import { ArrowUp } from "react-bootstrap-icons";

// A floating "back to top" button shown on every page once you've scrolled down.
// Clicking smooth-scrolls to the top.
function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      aria-label="Back to top"
      className="fixed bottom-5 right-4 z-40 grid h-12 w-12 place-items-center border border-brand-gold/35 bg-brand-forest/92 text-white shadow-[0_14px_32px_rgba(6,63,44,0.22)] backdrop-blur transition hover:bg-brand-emerald hover:!text-white focus:outline-none md:bottom-6 md:right-6"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      type="button"
    >
      <ArrowUp aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}

export default BackToTop;
