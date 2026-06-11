import ContactFormSection from "../../components/sections/ContactFormSection/ContactFormSection.jsx";
import PageHero from "../../components/sections/PageHero/PageHero.jsx";
import Container from "../../components/ui/Container/Container.jsx";
import { contactContent } from "../../content/contactContent.js";
import { seoContent } from "../../content/seoContent.js";
import { usePageMeta } from "../../hooks/usePageMeta.js";

function Contact() {
  usePageMeta(seoContent.contact);

  return (
    <>
      <PageHero
        eyebrow={contactContent.hero.eyebrow}
        image={contactContent.hero.image}
        imageAlt={contactContent.hero.imageAlt}
        subtitle={contactContent.hero.subtitle}
        title={contactContent.hero.title}
      />
      <ContactFormSection compact />
      <section className="bg-brand-cream/55 pb-16">
        <Container>
          <div className="border border-brand-forest/10 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-black tracking-[0] text-brand-forest">{contactContent.mapPlaceholder.title}</h2>
            <p className="mt-3 text-base leading-7 text-brand-muted">{contactContent.mapPlaceholder.body}</p>
            <div className="mt-6 grid min-h-60 place-items-center bg-brand-forest/10 text-center text-sm font-extrabold text-brand-forest">
              Map integration placeholder
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

export default Contact;
