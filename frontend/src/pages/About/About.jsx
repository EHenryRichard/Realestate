import Button from "../../components/ui/Button/Button.jsx";
import Container from "../../components/ui/Container/Container.jsx";
import SectionHeader from "../../components/ui/SectionHeader/SectionHeader.jsx";
import PageHero from "../../components/sections/PageHero/PageHero.jsx";
import { getIcon } from "../../config/iconConfig.js";
import { aboutContent } from "../../content/aboutContent.js";
import { seoContent } from "../../content/seoContent.js";
import { usePageMeta } from "../../hooks/usePageMeta.js";

function About() {
  usePageMeta(seoContent.about);

  return (
    <>
      <PageHero
        cta={{ label: "Speak With an Agent", href: "/contact" }}
        eyebrow={aboutContent.hero.eyebrow}
        image={aboutContent.hero.image}
        imageAlt={aboutContent.hero.imageAlt}
        subtitle={aboutContent.hero.subtitle}
        title={aboutContent.hero.title}
      />

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <SectionHeader eyebrow="Who we are" title="A careful partner for important property decisions." />
            <div className="grid gap-5 text-base leading-8 text-brand-muted">
              {aboutContent.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-brand-cream/50 py-16 sm:py-24">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            {[aboutContent.mission, aboutContent.vision].map((item) => (
              <article className="border border-brand-forest/10 bg-white p-7 shadow-sm" key={item.title}>
                <h2 className="text-2xl font-black tracking-[0] text-brand-forest">{item.title}</h2>
                <p className="mt-4 text-base leading-7 text-brand-muted">{item.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {aboutContent.values.map((value) => {
              const Icon = getIcon(value.iconKey, "checkCircle");

              return (
                <article className="border border-brand-forest/10 bg-white p-6 shadow-sm" key={value.title}>
                  <span className="grid h-12 w-12 place-items-center bg-brand-forest text-brand-gold">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-xl font-black tracking-[0] text-brand-forest">{value.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-brand-muted">{value.body}</p>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── Founder ── */}
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            {/* Photo */}
            <div className="relative">
              <div className="absolute -left-3 -top-3 hidden h-full w-full border border-brand-gold/40 sm:block" aria-hidden="true" />
              <img
                alt={aboutContent.founder.photoAlt}
                className="relative aspect-4/5 w-full object-cover object-top shadow-lg"
                loading="lazy"
                src={aboutContent.founder.photo}
              />
            </div>

            {/* Bio */}
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-brand-gold">
                {aboutContent.founder.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-brand-forest sm:text-4xl">
                {aboutContent.founder.name}
              </h2>
              <p className="mt-2 text-sm font-extrabold uppercase tracking-wider text-brand-forest/70">
                {aboutContent.founder.role}
              </p>
              <p className="mt-1 text-sm text-brand-muted">{aboutContent.founder.origin}</p>

              <div className="mt-6 grid gap-4 text-base leading-8 text-brand-muted">
                {aboutContent.founder.bio.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              <blockquote className="mt-8 border-l-4 border-brand-gold bg-brand-cream/50 py-4 pl-6 pr-4">
                <p className="text-lg font-black italic text-brand-forest">
                  {aboutContent.founder.quote}
                </p>
              </blockquote>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-brand-cream/40 py-16 sm:py-20">
        <Container size="narrow">
          <div className="text-center">
            <p className="text-lg leading-8 text-brand-muted">{aboutContent.closing}</p>
            <Button className="mt-7" to="/contact" variant="dark">
              Contact Sureboy Realty
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}

export default About;
