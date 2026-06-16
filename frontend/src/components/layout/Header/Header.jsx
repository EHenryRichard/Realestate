import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronDown, Envelope, Heart, Person } from "react-bootstrap-icons";
import { siteConfig } from "../../../config/siteConfig.js";
import Container from "../../ui/Container/Container.jsx";
import MobileDrawer from "./MobileDrawer.jsx";
import MobileNav from "./MobileNav.jsx";

function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const headerRef = useRef(null);
  const triggerRef = useRef(null);
  const location = useLocation();
  const navTextActionClass =
    "relative hidden min-h-10 items-center text-xs font-normal uppercase tracking-[0.01em] transition hover:text-brand-gold after:absolute after:bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-brand-gold after:transition-transform hover:after:scale-x-100";
  const navIconActionClass =
    "relative hidden min-h-10 items-center transition hover:text-brand-gold after:absolute after:bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-brand-gold after:transition-transform hover:after:scale-x-100";

  const openDrawer = () => setIsDrawerOpen((currentValue) => !currentValue);

  const closeDrawer = useCallback((shouldReturnFocus = true) => {
    setIsDrawerOpen(false);
    if (shouldReturnFocus) {
      window.setTimeout(() => triggerRef.current?.focus(), 0);
    }
  }, []);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    const updateHeaderState = () => {
      const heroElement = document.querySelector("[data-page-hero]");
      const headerHeight = headerRef.current?.offsetHeight || 0;

      if (!heroElement) {
        setIsPastHero(window.scrollY > 8);
        return;
      }

      const heroBottom = heroElement.getBoundingClientRect().bottom;
      setIsPastHero(heroBottom <= headerHeight);
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });
    window.addEventListener("resize", updateHeaderState);

    return () => {
      window.removeEventListener("scroll", updateHeaderState);
      window.removeEventListener("resize", updateHeaderState);
    };
  }, [location.pathname]);

  return (
    <>
      <header
        ref={headerRef}
        className={[
          "fixed left-0 right-0 top-0 z-40 border-b text-white transition",
          isPastHero
            ? "border-transparent bg-[#063f2ca1] shadow-[0_12px_45px_rgba(6,63,44,0.2)] backdrop-blur-md"
            : "border-transparent bg-transparent",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Container className="grid min-h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 md:min-h-[4.5rem]">
          <div className="flex min-w-0 items-center gap-4">
            <MobileNav isOpen={isDrawerOpen} onOpen={openDrawer} triggerRef={triggerRef} />
            <Link
              className={`${navTextActionClass} gap-3 md:inline-flex`}
              to="/properties"
            >
              <Bell aria-hidden="true" className="h-5 w-5" />
              <span>Create an Alert</span>
            </Link>
            <Link
              className={`${navTextActionClass} xl:inline-flex`}
              to="/services#real-estate-consultancy"
            >
              Real Estate Valuation
            </Link>
          </div>

          <Link className="flex items-center justify-center transition" to="/">
            <img
              alt="Sureboy Realty"
              className="h-10 w-auto object-contain md:h-12"
              src="/images/logo/logo.png"
            />
          </Link>

          <div className="flex min-w-0 items-center justify-end gap-3">
            <Link
              className={`${navTextActionClass} xl:inline-flex`}
              to="/contact"
            >
              Become Advertiser
            </Link>
            <a
              aria-label="Email Sureboy Realty"
              className={`${navIconActionClass} sm:inline-flex`}
              href={`mailto:${siteConfig.email}`}
            >
              <Envelope aria-hidden="true" className="h-5 w-5" />
            </a>
            <Link
              aria-label="View saved houses"
              className={`${navIconActionClass} md:inline-flex`}
              to="/saved-houses"
            >
              <Heart aria-hidden="true" className="h-5 w-5" />
            </Link>
            <Link
              aria-label="Speak with an agent"
              className="relative min-h-10 items-center transition hover:text-brand-gold after:absolute after:bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-brand-gold after:transition-transform hover:after:scale-x-100 sm:inline-flex"
              to="/contact"
            >
              <Person aria-hidden="true" className="h-5 w-5" />
            </Link>
            <span className="hidden h-7 w-px bg-white/32 md:block" aria-hidden="true" />
            <button
              aria-label="Change language"
              className="hidden min-h-10 items-center gap-2 text-xs font-normal uppercase tracking-[0.01em] transition hover:text-brand-gold focus:outline-none focus:ring-0 md:inline-flex"
              type="button"
            >
              EN
              <ChevronDown aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </Container>
      </header>
      <MobileDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
    </>
  );
}

export default Header;
