import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Heart, Person } from "react-bootstrap-icons";
import { useClientAuth } from "../../../hooks/useClientAuth.jsx";
import { navLinks } from "../../../data/navLinks.js";
import Container from "../../ui/Container/Container.jsx";
import DesktopNav from "./DesktopNav.jsx";
import MobileDrawer from "./MobileDrawer.jsx";
import MobileNav from "./MobileNav.jsx";

function Header() {
  // Account-aware: the person icon leads to the dashboard when signed in,
  // otherwise to the login page.
  const { client, isAuthenticated, isCheckingSession } = useClientAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const headerRef = useRef(null);
  const triggerRef = useRef(null);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const shouldUseSolidHeader = !isHome || isPastHero || isDrawerOpen;
  const canUseSavedHouses = isAuthenticated && client?.emailVerified;
  const navIconActionClass =
    "inline-flex min-h-10 items-center gap-1.5 px-2 text-xs font-extrabold uppercase tracking-[0.01em] text-white/82 transition hover:bg-white/8 hover:text-brand-gold sm:px-3";

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
      if (!isHome) {
        setIsPastHero(true);
        return;
      }

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
  }, [isHome, location.pathname]);

  return (
    <>
      <header
        ref={headerRef}
        className={[
          "fixed left-0 right-0 top-0 z-40 border-b text-white transition",
          shouldUseSolidHeader
            ? "border-transparent bg-[#063f2ca1] shadow-[0_12px_45px_rgba(6,63,44,0.2)] backdrop-blur-md"
            : "border-transparent bg-transparent",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Container className="flex min-h-16 items-center justify-between gap-4 md:min-h-[4.5rem]">
          <div className="flex min-w-0 items-center gap-3">
            <MobileNav isOpen={isDrawerOpen} onOpen={openDrawer} triggerRef={triggerRef} />
            <Link className="flex items-center justify-center transition" to="/">
              <img
                alt="Sureboy Realty"
                className="h-10 w-auto object-contain md:h-12"
                src="/images/logo/logo.png"
              />
            </Link>
          </div>

          <DesktopNav links={navLinks} />

          <div className="flex shrink-0 items-center justify-end gap-1">
            {!isCheckingSession && isAuthenticated ? (
              <>
                {canUseSavedHouses ? (
                  <Link
                    aria-label="View saved houses"
                    className={navIconActionClass}
                    to="/saved-houses"
                  >
                    <Heart aria-hidden="true" className="h-5 w-5" />
                    <span>Saved</span>
                  </Link>
                ) : null}
                <Link
                  aria-label="My account"
                  className={navIconActionClass}
                  to="/dashboard"
                >
                  <Person aria-hidden="true" className="h-5 w-5" />
                  <span>Account</span>
                </Link>
              </>
            ) : null}
            {!isCheckingSession && !isAuthenticated ? (
              <Link
                aria-label="Sign in"
                className={navIconActionClass}
                to="/login"
              >
                <Person aria-hidden="true" className="h-5 w-5" />
                <span>Sign in</span>
              </Link>
            ) : null}
          </div>
        </Container>
      </header>
      <MobileDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
    </>
  );
}

export default Header;
