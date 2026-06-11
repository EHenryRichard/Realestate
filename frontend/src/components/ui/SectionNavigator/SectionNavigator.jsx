import { useEffect, useRef, useState } from "react";
import { ArrowUp, List, XLg } from "react-bootstrap-icons";

function SectionNavigator({ sections = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeId, setActiveId] = useState(sections[0]?.id || "");
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const updateState = () => {
      const heroElement = document.querySelector("[data-page-hero]");
      const heroBottom = heroElement?.getBoundingClientRect().bottom || 0;
      const scrollProbe = window.scrollY + window.innerHeight * 0.35;
      let nextActiveId = sections[0]?.id || "";

      sections.forEach((section) => {
        const element = document.getElementById(section.id);

        if (element && element.offsetTop <= scrollProbe) {
          nextActiveId = section.id;
        }
      });

      setActiveId(nextActiveId);
      setIsVisible(heroElement ? heroBottom <= 96 : window.scrollY > 320);
    };

    updateState();
    window.addEventListener("scroll", updateState, { passive: true });
    window.addEventListener("resize", updateState);

    return () => {
      window.removeEventListener("scroll", updateState);
      window.removeEventListener("resize", updateState);
    };
  }, [sections]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.querySelector("button")?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!sections.length || !isVisible) {
    return null;
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);

    if (!element) {
      return;
    }

    const headerOffset = document.querySelector("header")?.offsetHeight || 0;
    const targetTop = element.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({
      behavior: "smooth",
      top: Math.max(targetTop, 0),
    });
    setActiveId(sectionId);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      {isOpen ? (
        <button
          aria-label="Close section navigator"
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => setIsOpen(false)}
          type="button"
        />
      ) : null}

      <div className="fixed right-0 top-1/2 z-40 -translate-y-1/2">
        <button
          aria-controls="home-section-navigator"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close home section navigator" : "Open home section navigator"}
          className="grid min-h-12 min-w-11 place-items-center border-l border-t border-b border-brand-gold/24 bg-brand-forest text-white shadow-[0_14px_32px_rgba(6,63,44,0.22)] transition hover:text-brand-gold focus:outline-none focus:ring-0"
          onClick={() => setIsOpen((currentValue) => !currentValue)}
          ref={triggerRef}
          type="button"
        >
          {isOpen ? <XLg aria-hidden="true" className="h-5 w-5" /> : <List aria-hidden="true" className="h-6 w-6" />}
        </button>
      </div>

      <button
        aria-label="Back to top"
        className="fixed bottom-5 right-4 z-40 grid h-12 w-12 place-items-center border border-brand-gold/35 bg-brand-forest/92 text-white shadow-[0_14px_32px_rgba(6,63,44,0.22)] backdrop-blur transition hover:bg-brand-emerald hover:text-brand-gold focus:outline-none focus:ring-0 md:bottom-6 md:right-6"
        onClick={() => scrollToSection(sections[0].id)}
        type="button"
      >
        <ArrowUp aria-hidden="true" className="h-5 w-5" />
      </button>

      {isOpen ? (
        <aside
          aria-label="Home page sections"
          className="fixed bottom-20 left-4 right-4 z-40 border border-brand-gold/20 bg-brand-forest/96 p-4 text-white shadow-[0_22px_58px_rgba(6,63,44,0.32)] backdrop-blur md:bottom-auto md:left-auto md:right-14 md:top-1/2 md:w-80 md:-translate-y-1/2"
          id="home-section-navigator"
          ref={panelRef}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.01em] text-brand-gold-soft">Sections</p>
          <nav className="mt-4" aria-label="Home section links">
            <ul className="grid gap-1">
              {sections.map((section) => {
                const isActive = section.id === activeId;

                return (
                  <li key={section.id}>
                    <button
                      aria-current={isActive ? "location" : undefined}
                      className={[
                        "group flex min-h-10 w-full items-center gap-3 px-2 text-left text-sm font-medium uppercase tracking-[0.01em] transition hover:-translate-x-1 hover:text-brand-gold focus:outline-none focus:ring-0",
                        isActive ? "text-brand-gold" : "text-white/78",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => scrollToSection(section.id)}
                      type="button"
                    >
                      <span
                        className={[
                          "h-6 w-1 bg-brand-gold transition",
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-hidden="true"
                      />
                      <span>{section.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
      ) : null}
    </>
  );
}

export default SectionNavigator;
