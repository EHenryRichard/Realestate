import { homeContent } from "../../../content/homeContent.js";
import { useServices } from "../../../hooks/useServices.js";
import Container from "../../ui/Container/Container.jsx";
import EmptyState from "../../ui/EmptyState/EmptyState.jsx";
import ErrorState from "../../ui/ErrorState/ErrorState.jsx";
import LoadingState from "../../ui/LoadingState/LoadingState.jsx";
import SectionHeader from "../../ui/SectionHeader/SectionHeader.jsx";
import ServiceCard from "../../ui/ServiceCard/ServiceCard.jsx";

function ServicesSection({ limit }) {
  const { services, loading, error, empty } = useServices();
  const visibleServices = limit ? services.slice(0, limit) : services;
  const section = homeContent.sections.services;

  return (
    <section className="bg-brand-cream/45 py-20 sm:py-24">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader eyebrow={section.eyebrow} subtitle={section.subtitle} title={section.title} />
        </div>

        <div className="mt-10">
          {loading ? <LoadingState label="Loading services" /> : null}
          {error ? <ErrorState message={error} title="Could not load services" /> : null}
          {empty ? <EmptyState message="Service information will appear here soon." title="No services available" /> : null}
          {!loading && !error && !empty ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

export default ServicesSection;
