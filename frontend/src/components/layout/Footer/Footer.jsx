import { Link } from "react-router-dom";
import { getIcon } from "../../../config/iconConfig.js";
import { getSiteWhatsAppLink, siteConfig } from "../../../config/siteConfig.js";
import { footerLinks } from "../../../data/footerLinks.js";
import Container from "../../ui/Container/Container.jsx";

function FooterLink({ href, children, className = "" }) {
  const base = `text-white/70 transition hover:text-brand-gold ${className}`.trim();
  if (href.startsWith("/")) {
    return <Link className={base} to={href}>{children}</Link>;
  }
  return <a className={base} href={href} rel="noreferrer" target={href.startsWith("http") ? "_blank" : undefined}>{children}</a>;
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-widest text-brand-gold">{title}</p>
      <ul className="mt-5 grid gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <FooterLink className="text-sm" href={link.href}>{link.label}</FooterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  const WhatsAppIcon = getIcon("whatsapp");
  const TelIcon     = getIcon("telephone");
  const MailIcon    = getIcon("envelope");
  const GeoIcon     = getIcon("geoAlt");
  const ClockIcon   = getIcon("calendarCheck");

  return (
    <footer className="bg-brand-forest text-white">
      {/* WhatsApp strip */}
      <a
        className="flex items-center justify-between gap-4 bg-[#075e54] px-6 py-4 transition hover:bg-[#128c7e]"
        href={getSiteWhatsAppLink()}
        rel="noreferrer"
        target="_blank"
      >
        <div className="flex items-center gap-3">
          <WhatsAppIcon className="h-5 w-5 shrink-0 text-[#25d366]" />
          <span className="text-sm font-semibold text-white">
            Talk to us on WhatsApp — we reply fast.
          </span>
        </div>
        <span className="shrink-0 text-xs font-extrabold uppercase tracking-widest text-[#25d366]">
          Chat Now →
        </span>
      </a>

      {/* Main footer body */}
      <Container className="py-14 md:py-20" size="wide">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">

          {/* Brand column */}
          <div>
            <Link className="inline-block" to="/">
              <img
                alt="Sureboy Realty"
                className="h-12 w-auto object-contain brightness-0 invert"
                src="/images/logo/logo.png"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-white/60">
              {siteConfig.tagline}
            </p>

            <div className="mt-8 grid gap-3">
              <a
                className="flex items-center gap-3 text-sm text-white/70 transition hover:text-brand-gold"
                href={`tel:${siteConfig.phoneCompact}`}
              >
                <TelIcon className="h-4 w-4 shrink-0 text-brand-gold" />
                {siteConfig.phone}
              </a>
              <a
                className="flex items-center gap-3 text-sm text-white/70 transition hover:text-brand-gold"
                href={`mailto:${siteConfig.email}`}
              >
                <MailIcon className="h-4 w-4 shrink-0 text-brand-gold" />
                {siteConfig.email}
              </a>
              <span className="flex items-center gap-3 text-sm text-white/60">
                <GeoIcon className="h-4 w-4 shrink-0 text-brand-gold" />
                {siteConfig.address}
              </span>
              <span className="flex items-center gap-3 text-sm text-white/60">
                <ClockIcon className="h-4 w-4 shrink-0 text-brand-gold" />
                {siteConfig.businessHours}
              </span>
            </div>

            {/* Social icons */}
            <div className="mt-8 flex items-center gap-3">
              {siteConfig.socialLinks.map((social) => {
                const Icon = getIcon(social.iconKey);
                return (
                  <a
                    aria-label={social.label}
                    className="grid h-9 w-9 place-items-center border border-white/14 text-white/60 transition hover:border-brand-gold hover:text-brand-gold"
                    href={social.href}
                    key={social.label}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid gap-10 sm:grid-cols-3">
            <FooterColumn links={footerLinks.company} title="Company" />
            <FooterColumn links={footerLinks.services} title="Help We Offer" />
            <FooterColumn links={footerLinks.properties} title="Houses & Land" />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} {siteConfig.brandName}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {footerLinks.legal.map((link) => (
              <FooterLink className="text-xs text-white/40 hover:text-brand-gold" href={link.href} key={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
