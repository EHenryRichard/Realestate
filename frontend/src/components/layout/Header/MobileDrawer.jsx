import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { X } from "react-bootstrap-icons";
import { getIcon } from "../../../config/iconConfig.js";
import { getSiteWhatsAppLink, siteConfig } from "../../../config/siteConfig.js";
import { mainMenuUtilityLinks } from "../../../data/mainMenuLinks.js";
import { navLinks } from "../../../data/navLinks.js";
import { useClientAuth } from "../../../hooks/useClientAuth.jsx";
import Button from "../../ui/Button/Button.jsx";

function MobileDrawer({ isOpen, onClose }) {
  const { client, isAuthenticated, isCheckingSession } = useClientAuth();
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const AgentIcon = getIcon("personCheck");
  const CallIcon = getIcon("telephone");
  const WhatsAppIcon = getIcon("whatsapp");
  const canUseSavedHouses = isAuthenticated && client?.emailVerified;
  const userMenuLinks = isAuthenticated
    ? [
        ...(canUseSavedHouses
          ? [
              {
                id: "saved",
                label: "Saved Houses",
                helper: "Your saved options",
                href: "/saved-houses",
                iconKey: "heart",
              },
            ]
          : []),
        {
          id: "account",
          label: "My Account",
          helper: canUseSavedHouses ? "Saved, viewed, and messages" : "Verify email to unlock saved houses",
          href: "/dashboard",
          iconKey: "personCheck",
        },
      ]
    : [
        {
          id: "login",
          label: "Sign In",
          helper: "Open your account",
          href: "/login",
          iconKey: "key",
        },
        {
          id: "register",
          label: "Create Account",
          helper: "Save houses and message us",
          href: "/register",
          iconKey: "personCheck",
        },
      ];

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
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close navigation overlay"
        className="absolute inset-0 h-full w-full bg-brand-forest/58 transition"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label="Main navigation"
        aria-modal="true"
        className="drawer-panel drawer-scrollbar absolute inset-y-0 left-0 flex w-[min(23rem,88vw)] flex-col overflow-y-auto border-r border-white/10 bg-brand-forest px-4 pb-6 pt-5 text-white shadow-2xl sm:px-5 md:w-[23rem]"
        id="mobile-nav-drawer"
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="drawer-link mb-4 flex items-start justify-between gap-4 border-b border-white/12 pb-4">
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
          className="drawer-link mb-4 grid grid-cols-2 gap-2"
          style={{ animationDelay: "70ms" }}
        >
          <a
            className="flex min-h-14 items-center gap-3 bg-brand-gold px-3 py-2 text-brand-forest transition hover:bg-brand-gold-soft focus:outline-none focus:ring-0"
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
            className="flex min-h-14 items-center gap-3 border border-white/14 bg-white/6 px-3 py-2 text-white transition hover:bg-white/10 hover:!text-white focus:outline-none focus:ring-0"
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

        <nav aria-label="Main menu" className="grid gap-1.5">
          {navLinks.map((link, index) => {
            const LinkIcon = getIcon(link.iconKey);

            return (
              <NavLink
                className={({ isActive }) =>
                  [
                    'drawer-link group flex min-h-14 items-center gap-3 px-3 py-2 text-white transition duration-200 hover:bg-white/6 hover:text-white',
                    isActive ? 'bg-white/10 text-brand-gold' : 'text-white/82',
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
                          ? 'text-brand-gold'
                          : 'text-white/64 group-hover:text-white',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-hidden="true"
                    >
                      <LinkIcon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-extrabold uppercase leading-tight tracking-[0.01em]">
                        {link.label}
                      </span>
                      {link.helper ? (
                        <span className={`mt-1 block text-xs font-medium normal-case leading-tight ${isActive ? 'text-white/72' : 'text-white/58 group-hover:text-white/76'}`}>
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
          {!isCheckingSession ? (
            <div className="drawer-link mb-4 grid gap-2">
              <p className="px-3 text-[0.68rem] font-extrabold uppercase tracking-[0.01em] text-brand-gold">
                {isAuthenticated ? "Your Account" : "Account"}
              </p>
              {userMenuLinks.map((link, index) => {
                const UserIcon = getIcon(link.iconKey);

                return (
                  <NavLink
                    className={({ isActive }) =>
                      [
                        "group flex min-h-12 items-center gap-3 px-3 text-sm font-semibold text-white/82 transition duration-200 hover:bg-white/6 hover:text-white",
                        isActive ? "bg-white/10 text-brand-gold" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")
                    }
                    key={link.id}
                    onClick={onClose}
                    style={{ animationDelay: `${285 + index * 35}ms` }}
                    to={link.href}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={[
                            "grid h-9 w-9 shrink-0 place-items-center transition",
                            isActive ? "text-brand-gold" : "text-white/64 group-hover:text-white",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          aria-hidden="true"
                        >
                          <UserIcon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block leading-tight">{link.label}</span>
                          <span className="mt-1 block text-xs leading-tight text-white/58">
                            {link.helper}
                          </span>
                        </span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ) : null}

          <div className="grid gap-2">
            {mainMenuUtilityLinks.map((link, index) => {
              const UtilityIcon = getIcon(link.iconKey);

              return (
                <NavLink
                  className="drawer-link group flex min-h-12 items-center gap-3 px-3 text-sm font-normal text-white/78 transition duration-200 hover:bg-white/6 hover:text-white"
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
