import { getIcon } from "../../../config/iconConfig.js";
import { getSiteWhatsAppLink, siteConfig } from "../../../config/siteConfig.js";
import { contactContent } from "../../../content/contactContent.js";
import { servicesData } from "../../../data/servicesData.js";
import { useContactForm } from "../../../hooks/useContactForm.js";
import Button from "../../ui/Button/Button.jsx";
import Container from "../../ui/Container/Container.jsx";
import Input from "../../ui/Input/Input.jsx";
import Select from "../../ui/Select/Select.jsx";
import Textarea from "../../ui/Textarea/Textarea.jsx";

const serviceOptions = servicesData.map((service) => ({
  label: service.title,
  value: service.title,
}));

const getContactValue = (key) => {
  if (key === "whatsapp") {
    return siteConfig.phone;
  }

  return siteConfig[key] || "";
};

const getContactHref = (key) => {
  if (key === "phone") {
    return `tel:${siteConfig.phoneCompact}`;
  }

  if (key === "email") {
    return `mailto:${siteConfig.email}`;
  }

  if (key === "whatsapp") {
    return getSiteWhatsAppLink();
  }

  return "";
};

function ContactFormSection({ compact = false }) {
  const form = useContactForm();

  return (
    <section className={`bg-white ${compact ? "py-10" : "py-20 sm:py-24"}`}>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-gold">{contactContent.hero.eyebrow}</p>
            <h2 className="mt-3 text-balance text-3xl font-black tracking-[0] text-brand-forest sm:text-4xl">
              {contactContent.form.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-brand-muted">{contactContent.form.subtitle}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {contactContent.contactCards.map((card) => {
                const Icon = getIcon(card.iconKey, "infoCircle");
                const href = getContactHref(card.valueKey);
                const value = getContactValue(card.valueKey);

                const content = (
                  <article className="h-full border border-brand-forest/10 bg-brand-cream/45 p-5 transition hover:border-brand-gold/60">
                    <Icon aria-hidden="true" className="h-6 w-6 text-brand-gold" />
                    <h3 className="mt-4 font-black tracking-[0] text-brand-forest">{card.title}</h3>
                    <p className="mt-2 break-words text-sm leading-6 text-brand-muted">{value}</p>
                  </article>
                );

                return href ? (
                  <a href={href} key={card.title} rel={card.valueKey === "whatsapp" ? "noreferrer" : undefined} target={card.valueKey === "whatsapp" ? "_blank" : undefined}>
                    {content}
                  </a>
                ) : (
                  <div key={card.title}>{content}</div>
                );
              })}
            </div>
          </div>

          <form className="border border-brand-forest/10 bg-brand-cream/45 p-5 shadow-sm sm:p-7" onSubmit={form.submit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                error={form.errors.fullName}
                label="Full name"
                name="fullName"
                onChange={form.updateField}
                placeholder="Your full name"
                type="text"
                value={form.values.fullName}
              />
              <Input
                error={form.errors.email}
                label="Email address"
                name="email"
                onChange={form.updateField}
                placeholder="you@example.com"
                type="email"
                value={form.values.email}
              />
              <Input
                error={form.errors.phone}
                label="Phone number"
                name="phone"
                onChange={form.updateField}
                placeholder="+234..."
                type="tel"
                value={form.values.phone}
              />
              <Select
                error={form.errors.service}
                label="Service interested in"
                name="service"
                onChange={form.updateField}
                options={serviceOptions}
                placeholder="Choose service"
                value={form.values.service}
              />
              <Textarea
                className="sm:col-span-2"
                error={form.errors.message}
                label="Message"
                name="message"
                onChange={form.updateField}
                placeholder="Tell us what you need help with."
                value={form.values.message}
              />
            </div>

            {form.success ? (
              <p className="mt-5 border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                {contactContent.form.successMessage}
              </p>
            ) : null}
            {form.submitError ? (
              <p className="mt-5 border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                {form.submitError || contactContent.form.errorMessage}
              </p>
            ) : null}

            <Button className="mt-6 w-full sm:w-auto" disabled={form.submitting} type="submit" variant="primary">
              {form.submitting ? "Sending Message" : contactContent.form.submitLabel}
            </Button>
          </form>
        </div>
      </Container>
    </section>
  );
}

export default ContactFormSection;
