import { ArrowRight } from "react-bootstrap-icons";
import { homeContent } from "../../../content/homeContent.js";
import { useProperties } from "../../../hooks/useProperties.js";
import Button from "../../ui/Button/Button.jsx";
import Container from "../../ui/Container/Container.jsx";
import EmptyState from "../../ui/EmptyState/EmptyState.jsx";
import ErrorState from "../../ui/ErrorState/ErrorState.jsx";
import PropertyCard from "../../ui/PropertyCard/PropertyCard.jsx";
import SectionHeader from "../../ui/SectionHeader/SectionHeader.jsx";
import SkeletonCard from "../../ui/SkeletonCard/SkeletonCard.jsx";

function FeaturedProperties() {
  const { properties, loading, error, empty } = useProperties({ featured: true });
  const section = homeContent.sections.featuredProperties;

  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader eyebrow={section.eyebrow} subtitle={section.subtitle} title={section.title} />
          <Button icon={ArrowRight} to="/properties" variant="ghost">
            See All Houses & Land
          </Button>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : null}
          {error ? <ErrorState message={error} title="Could not load houses and land" /> : null}
          {empty ? (
            <EmptyState
              cta={{ label: "Contact Us", href: "/contact" }}
              message="New houses and land are being prepared."
              title="Nothing featured yet"
            />
          ) : null}
          {!loading && !error && !empty ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {properties.slice(0, 3).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

export default FeaturedProperties;
