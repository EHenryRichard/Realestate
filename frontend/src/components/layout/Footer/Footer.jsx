import { Link } from "react-router-dom";
import { siteConfig } from "../../../config/siteConfig.js";
import { footerLinks } from "../../../data/footerLinks.js";
import Container from "../../ui/Container/Container.jsx";

function FooterLink({ href, children, className = "" }) {
  const classes = `transition hover:text-brand-gold ${className}`.trim();

  if (href.startsWith("/")) {
    return (
      <Link className={classes} to={href}>
        {children}
      </Link>
    );
  }

  return (
    <a className={classes} href={href}>
      {children}
    </a>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h2 className="font-sans text-sm font-medium uppercase tracking-[0.01em] text-brand-gold-soft">
        {title}
      </h2>
      <ul className="mt-7 grid gap-5 text-sm font-medium text-white">
        {links.map((link) => (
          <li key={link.href}>
            <FooterLink href={link.href}>{link.label}</FooterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterSocialLinks({ className = "" }) {
  return (
    <div className={`flex flex-wrap gap-x-7 gap-y-3 ${className}`.trim()}>
      {siteConfig.socialLinks.map((social) => (
        <a
          className="text-sm underline underline-offset-2 transition hover:text-brand-gold"
          href={social.href}
          key={social.label}
          rel="noreferrer"
          target="_blank"
        >
          {social.label}
        </a>
      ))}
    </div>
  );
}

function FooterContactActions({ className = "" }) {
  return (
    <div className={`inline-flex border border-brand-gold/24 bg-brand-gold/48 shadow-[0_18px_42px_rgba(6,63,44,0.28)] ${className}`.trim()}>
      <a
        className="px-7 py-4 text-sm font-medium uppercase tracking-[0.01em] transition hover:bg-brand-gold hover:text-brand-forest"
        href={`tel:${siteConfig.phoneCompact}`}
      >
        Call Us
      </a>
      <span className="my-4 w-px bg-brand-gold/45" aria-hidden="true" />
      <Link
        className="px-7 py-4 text-sm font-medium uppercase tracking-[0.01em] transition hover:bg-brand-gold hover:text-brand-forest"
        to="/contact"
      >
        Contact
      </Link>
    </div>
  );
}

function FooterAddress({ className = "" }) {
  return (
    <address className={`not-italic text-sm leading-8 text-white/82 ${className}`.trim()}>
      <p className="font-medium text-white">{siteConfig.brandName} Office</p>
      <p className="mt-6">{siteConfig.address}</p>
      <p>{siteConfig.businessHours}</p>
      <a className="block transition hover:text-brand-gold" href={`tel:${siteConfig.phoneCompact}`}>
        {siteConfig.phone}
      </a>
      <a className="block transition hover:text-brand-gold" href={`mailto:${siteConfig.email}`}>
        {siteConfig.email}
      </a>
    </address>
  );
}

function FooterLegal() {
  return (
    <p className="text-sm text-white/76">
      &copy; {new Date().getFullYear()} {siteConfig.brandName}.{" "}
      {footerLinks.legal.map((link, index) => (
        <span key={link.href}>
          {index > 0 ? " | " : ""}
          <FooterLink className="text-white hover:text-brand-gold" href={link.href}>
            {link.label}
          </FooterLink>
        </span>
      ))}
    </p>
  );
}

function Footer() {
  return (
    <footer className="bg-brand-forest text-white">
      <Container className="py-12 md:py-20" size="wide">
        <div className="lg:hidden">
          <div className="grid grid-cols-2 gap-x-10 gap-y-12">
            <FooterColumn links={footerLinks.navigation} title="Navigation" />
            <FooterColumn links={footerLinks.collection} title="Collection" />
          </div>

          <div className="mt-12">
            <h2 className="font-sans text-sm font-medium uppercase tracking-[0.01em] text-brand-gold-soft">
              Contact
            </h2>
            <ul className="mt-7 grid gap-5 text-sm font-medium text-white">
              <li>
                <a className="transition hover:text-brand-gold" href={`mailto:${siteConfig.email}`}>
                  {siteConfig.email}
                </a>
              </li>
              <li>
                <a className="transition hover:text-brand-gold" href={`tel:${siteConfig.phoneCompact}`}>
                  {siteConfig.phone}
                </a>
              </li>
            </ul>
          </div>

          <FooterAddress className="mt-14" />
          <FooterSocialLinks className="mt-14" />

          <div className="mt-12 grid gap-7">
            <FooterLegal />
            <div>
              <FooterContactActions />
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="grid gap-20 lg:grid-cols-[minmax(20rem,36rem)_1fr]">
            <div className="max-w-xl">
              <h2 className="font-sans text-4xl font-normal uppercase leading-tight tracking-[0.01em] text-white">
                Get In Touch
              </h2>

              <div className="mt-10 grid gap-3">
                {footerLinks.contactActions.map((action) => (
                  <FooterLink
                    className="block border border-brand-gold/18 bg-brand-emerald/42 px-7 py-5 text-sm font-medium uppercase tracking-[0.01em] text-brand-gold-soft hover:bg-brand-gold hover:text-brand-forest"
                    href={action.href}
                    key={action.label}
                  >
                    {action.label}
                  </FooterLink>
                ))}
              </div>

              <FooterAddress className="mt-24" />
            </div>

            <div className="grid gap-10 sm:grid-cols-3">
              <FooterColumn links={footerLinks.navigation} title="Navigation" />
              <FooterColumn links={footerLinks.collection} title="Collection" />

              <div>
                <h2 className="font-sans text-sm font-medium uppercase tracking-[0.01em] text-brand-gold-soft">
                  Contact
                </h2>
                <ul className="mt-7 grid gap-5 text-sm font-medium text-white">
                  <li>
                    <a className="transition hover:text-brand-gold" href={`mailto:${siteConfig.email}`}>
                      {siteConfig.email}
                    </a>
                  </li>
                  <li>
                    <a className="transition hover:text-brand-gold" href={`tel:${siteConfig.phoneCompact}`}>
                      {siteConfig.phone}
                    </a>
                  </li>
                  <li className="text-white/72">{siteConfig.address}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-20 grid gap-8 text-sm text-white lg:grid-cols-[1fr_auto_1fr] lg:items-end">
            <FooterLegal />

            <div className="flex justify-center">
              <FooterContactActions />
            </div>

            <FooterSocialLinks className="justify-end" />
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
