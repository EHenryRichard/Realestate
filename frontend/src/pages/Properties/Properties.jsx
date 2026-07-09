import { useState } from "react";
import PageHero from "../../components/sections/PageHero/PageHero.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import Container from "../../components/ui/Container/Container.jsx";
import EmptyState from "../../components/ui/EmptyState/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState/ErrorState.jsx";
import Input from "../../components/ui/Input/Input.jsx";
import PropertyCard from "../../components/ui/PropertyCard/PropertyCard.jsx";
import Select from "../../components/ui/Select/Select.jsx";
import SkeletonCard from "../../components/ui/SkeletonCard/SkeletonCard.jsx";
import { propertiesContent } from "../../content/propertiesContent.js";
import { seoContent } from "../../content/seoContent.js";
import { usePageMeta } from "../../hooks/usePageMeta.js";
import { useProperties } from "../../hooks/useProperties.js";

const initialFilters = {
  search: "",
  type: "",
  status: "",
  location: "",
  sort: "featured",
};

const sortOptions = [
  {
    label: "Featured first",
    value: "featured",
  },
  {
    label: "Newest",
    value: "newest",
  },
  {
    label: "Price low to high",
    value: "price-low",
  },
  {
    label: "Price high to low",
    value: "price-high",
  },
];

function Properties() {
  usePageMeta(seoContent.properties);
  const [filters, setFilters] = useState(initialFilters);
  const { properties, loading, error, empty, options } = useProperties({ filters });

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const clearFilters = () => setFilters(initialFilters);

  return (
    <>
      <PageHero
        eyebrow={propertiesContent.hero.eyebrow}
        image={propertiesContent.hero.image}
        imageAlt={propertiesContent.hero.imageAlt}
        subtitle={propertiesContent.hero.subtitle}
        title={propertiesContent.hero.title}
      />

      <section className="bg-brand-cream/45 py-8">
        <Container>
          <div className="grid gap-4 bg-white p-5 shadow-sm lg:grid-cols-[1.4fr_repeat(4,1fr)_auto] lg:items-end">
            <Input
              label="Search"
              name="search"
              onChange={updateFilter}
              placeholder={propertiesContent.filters.searchPlaceholder}
              type="search"
              value={filters.search}
            />
            <Select
              label="Type"
              name="type"
              onChange={updateFilter}
              options={options.types}
              placeholder={propertiesContent.filters.allTypes}
              value={filters.type}
            />
            <Select
              label="Status"
              name="status"
              onChange={updateFilter}
              options={options.statuses}
              placeholder={propertiesContent.filters.allStatuses}
              value={filters.status}
            />
            <Select
              label="Location"
              name="location"
              onChange={updateFilter}
              options={options.locations}
              placeholder={propertiesContent.filters.allLocations}
              value={filters.location}
            />
            <Select
              label={propertiesContent.filters.sortLabel}
              name="sort"
              onChange={updateFilter}
              options={sortOptions}
              value={filters.sort}
            />
            <Button className="lg:mb-0" onClick={clearFilters} type="button" variant="ghost">
              Clear
            </Button>
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-black tracking-[0] text-brand-forest">Available Houses & Land</h2>
            <p className="text-sm font-semibold text-brand-muted">{properties.length} result{properties.length === 1 ? "" : "s"}</p>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : null}
          {error ? <ErrorState message={error} title="Could not load houses and land" /> : null}
          {empty ? (
            <EmptyState
              cta={{ label: "Talk to Us", href: "/contact" }}
              message={propertiesContent.empty.body}
              title={propertiesContent.empty.title}
            />
          ) : null}
          {!loading && !error && !empty ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : null}
        </Container>
      </section>
    </>
  );
}

export default Properties;
