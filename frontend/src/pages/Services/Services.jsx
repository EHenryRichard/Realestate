import ContactCTA from "../../components/sections/ContactCTA/ContactCTA.jsx";
import PageHero from "../../components/sections/PageHero/PageHero.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import Container from "../../components/ui/Container/Container.jsx";
import EmptyState from "../../components/ui/EmptyState/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState/ErrorState.jsx";
import LoadingState from "../../components/ui/LoadingState/LoadingState.jsx";
import SectionHeader from "../../components/ui/SectionHeader/SectionHeader.jsx";
import ServiceCard from "../../components/ui/ServiceCard/ServiceCard.jsx";
import { servicesContent } from "../../content/servicesContent.js";
import { seoContent } from "../../content/seoContent.js";
import { usePageMeta } from "../../hooks/usePageMeta.js";
import { useServices } from "../../hooks/useServices.js";

function Services() {
  usePageMeta(seoContent.services);
  const { services, loading, error, empty } = useServices();

  return (
    <>
      <PageHero
        eyebrow={servicesContent.hero.eyebrow}
        image={servicesContent.hero.image}
        imageAlt={servicesContent.hero.imageAlt}
        subtitle={servicesContent.hero.subtitle}
        title={servicesContent.hero.title}
      />

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <SectionHeader eyebrow="Service overview" title="Structured support before and after the property decision." />
            <div>
              <p className="text-base leading-8 text-brand-muted">{servicesContent.overview}</p>
              <ul className="mt-6 grid gap-3">
                {servicesContent.benefits.map((benefit) => (
                  <li className="flex gap-3 text-brand-forest" key={benefit}>
                    <span className="mt-2 h-2 w-2 shrink-0 bg-brand-gold" aria-hidden="true" />
                    <span className="font-semibold leading-7">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12">
            {loading ? <LoadingState label="Loading services" /> : null}
            {error ? <ErrorState message={error} title="Could not load services" /> : null}
            {empty ? <EmptyState title="No services available" /> : null}
            {!loading && !error && !empty ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {services.map((service) => (
                  <div id={service.slug} key={service.id}>
                    <ServiceCard service={service} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Container>
      </section>

      <section className="bg-brand-cream/55 py-14">
        <Container>
          <div className="flex flex-col gap-5 bg-white p-7 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[0] text-brand-forest">{servicesContent.cta.title}</h2>
              <p className="mt-2 text-brand-muted">{servicesContent.cta.body}</p>
            </div>
            <Button to={servicesContent.cta.href} variant="primary">
              {servicesContent.cta.label}
            </Button>
          </div>
        </Container>
      </section>

      <ContactCTA />
    </>
  );
}

export default Services;
