import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { X } from "react-bootstrap-icons";
import { getIcon } from "../../../config/iconConfig.js";
import { getSiteWhatsAppLink, siteConfig } from "../../../config/siteConfig.js";
import { mainMenuUtilityLinks } from "../../../data/mainMenuLinks.js";
import { navLinks } from "../../../data/navLinks.js";
import Button from "../../ui/Button/Button.jsx";

function MobileDrawer({ isOpen, onClose }) {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const AgentIcon = getIcon("personCheck");
  const CallIcon = getIcon("telephone");
  const WhatsAppIcon = getIcon("whatsapp");

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        panelRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      );

      if (!focusableElements.length) {
        return;
      }

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }

      if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 md:bottom-0 md:left-0 md:right-0 md:top-[4.5rem] md:z-30">
      <button
        aria-label="Close navigation overlay"
        className="absolute inset-0 h-full w-full bg-brand-forest/58 transition"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label="Main navigation"
        aria-modal="true"
        className="drawer-panel drawer-scrollbar absolute inset-0 flex w-full flex-col overflow-y-auto border-r border-white/10 bg-brand-forest px-5 pb-6 pt-6 text-white shadow-2xl sm:px-6 md:bottom-0 md:left-0 md:right-auto md:top-0 md:w-[23rem]"
        id="mobile-nav-drawer"
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="drawer-link mb-5 flex items-start justify-between gap-4 border-b border-white/12 pb-4">
          <div className="flex items-center gap-3">
            <img
              alt="Sureboy Realty"
              className="h-9 w-auto object-contain"
              src="/images/logo/logo.png"
            />
            <div>
              <p className="text-[0.68rem] font-semibold uppercase leading-none tracking-[0.01em] text-brand-gold">
                {siteConfig.brandName}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.01em] text-white/72">
                Navigation
              </p>
            </div>
          </div>
          <button
            aria-label="Close navigation menu"
            className="grid min-h-10 min-w-10 place-items-center text-white/78 transition hover:text-brand-gold focus:outline-none focus:ring-0"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>

        <div
          className="drawer-link mb-5 grid grid-cols-2 gap-2"
          style={{ animationDelay: "70ms" }}
        >
          <a
            className="flex min-h-14 items-center gap-3 border border-brand-gold/35 bg-brand-gold px-3 py-2 text-brand-forest transition hover:bg-brand-forest hover:text-white focus:outline-none focus:ring-0"
            href={`tel:${siteConfig.phoneCompact}`}
            onClick={onClose}
          >
            <CallIcon aria-hidden="true" className="h-5 w-5 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-extrabold leading-tight">Call Now</span>
              <span className="block truncate text-[0.68rem] font-semibold leading-tight opacity-80">
                {siteConfig.phone}
              </span>
            </span>
          </a>
          <a
            className="flex min-h-14 items-center gap-3 border border-brand-gold/45 bg-brand-forest px-3 py-2 text-white transition hover:bg-brand-emerald hover:!text-white focus:outline-none focus:ring-0"
            href={getSiteWhatsAppLink()}
            onClick={onClose}
            rel="noreferrer"
            target="_blank"
          >
            <WhatsAppIcon aria-hidden="true" className="h-5 w-5 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-extrabold leading-tight">WhatsApp</span>
              <span className="block truncate text-[0.68rem] font-semibold leading-tight opacity-80">
                Fast reply
              </span>
            </span>
          </a>
        </div>

        <nav aria-label="Main menu" className="grid gap-2 md:gap-3">
          {navLinks.map((link, index) => {
            const LinkIcon = getIcon(link.iconKey);

            return (
              <NavLink
                className={({ isActive }) =>
                  [
                    'drawer-link group flex min-h-14 items-center gap-3 border-b border-white/10 px-3 py-2 text-white transition duration-300 hover:-translate-x-1 hover:bg-white/5 hover:text-white md:min-h-[3.75rem]',
                    isActive ? 'bg-white/8 text-white' : 'text-white/82',
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
                end={link.href === '/'}
                key={link.id}
                onClick={onClose}
                style={{ animationDelay: `${110 + index * 35}ms` }}
                to={link.href}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        'grid h-10 w-10 shrink-0 place-items-center transition duration-200',
                        isActive
                          ? 'text-white'
                          : 'text-white/64 group-hover:text-white',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-hidden="true"
                    >
                      <LinkIcon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold uppercase leading-tight tracking-[0.01em] md:text-base">
                        {link.label}
                      </span>
                      {link.helper ? (
                        <span className="mt-1 block text-xs font-medium normal-case leading-tight text-white/66 group-hover:text-white/80">
                          {link.helper}
                        </span>
                      ) : null}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/12 pt-4">
          <div className="grid gap-2">
            {mainMenuUtilityLinks.map((link, index) => {
              const UtilityIcon = getIcon(link.iconKey);

              return (
                <NavLink
                  className="drawer-link group flex min-h-12 items-center gap-3 text-sm font-normal text-white/78 transition duration-300 hover:-translate-x-1 hover:bg-white/5 hover:text-white"
                  key={link.id}
                  onClick={onClose}
                  style={{ animationDelay: `${315 + index * 35}ms` }}
                  to={link.href}
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center text-white/64 transition group-hover:text-white"
                    aria-hidden="true"
                  >
                    <UtilityIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block leading-tight">{link.label}</span>
                    {link.helper ? (
                      <span className="mt-1 block text-xs leading-tight text-white/58">
                        {link.helper}
                      </span>
                    ) : null}
                  </span>
                </NavLink>
              );
            })}
          </div>

          <Button
            className="drawer-link mt-5 w-full"
            icon={AgentIcon}
            iconPosition="left"
            onClick={onClose}
            size="md"
            to={siteConfig.cta.href}
          >
            {siteConfig.cta.label}
          </Button>
        </div>
      </aside>
    </div>
  );
}

export default MobileDrawer;
