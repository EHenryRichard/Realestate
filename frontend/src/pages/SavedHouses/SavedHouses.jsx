import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { clientApi } from "../../api/clientApi.js";
import PageHero from "../../components/sections/PageHero/PageHero.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import Container from "../../components/ui/Container/Container.jsx";
import EmptyState from "../../components/ui/EmptyState/EmptyState.jsx";
import { propertiesContent } from "../../content/propertiesContent.js";
import { usePageMeta } from "../../hooks/usePageMeta.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { getImageUrl } from "../../utils/getImageUrl.js";
import { showError, showSuccess } from "../../utils/toast.jsx";

function SavedPropertyCard({ property, onUnsave }) {
  const image = getImageUrl(property.mainImage || property.image, "/images/logo/logo.png");
  const propertyHref = property.slug ? `/properties/${property.slug}` : "/properties";

  return (
    <article className="grid gap-4 border border-brand-forest/10 bg-white p-4 shadow-sm sm:grid-cols-[9.5rem_1fr]">
      <Link className="block overflow-hidden bg-brand-cream" to={propertyHref}>
        <img
          alt={property.title || "Saved property"}
          className="h-40 w-full object-cover sm:h-full"
          src={image}
        />
      </Link>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="min-w-0">
          <Link
            className="block text-xl font-black tracking-[0] text-brand-forest transition hover:text-brand-gold"
            to={propertyHref}
          >
            {property.title || "Saved property"}
          </Link>
          <p className="mt-2 text-sm font-semibold text-brand-muted">{property.location || "Location not added"}</p>
          <p className="mt-3 text-lg font-black text-brand-forest">
            {formatCurrency(property.price, property.currency)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" to={propertyHref} variant="dark">
            View Details
          </Button>
          <button
            className="min-h-10 border border-red-200 px-4 text-sm font-extrabold text-red-700 transition hover:bg-red-600 hover:text-white"
            onClick={() => onUnsave(property.id)}
            type="button"
          >
            Unsave
          </button>
        </div>
      </div>
    </article>
  );
}

function SavedHouses() {
  const content = propertiesContent.savedHouses;
  const [savedProperties, setSavedProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  usePageMeta({
    title: "Saved Houses | Sureboy Realty",
    description: content.subtitle,
    ogImage: propertiesContent.hero.image,
  });

  const loadSavedProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await clientApi.listSaved();
      setSavedProperties(response?.data || []);
    } catch (error) {
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedProperties();
  }, [loadSavedProperties]);

  const handleUnsave = async (propertyId) => {
    try {
      await clientApi.unsaveProperty(propertyId);
      setSavedProperties((current) => current.filter((property) => property.id !== propertyId));
      showSuccess("Removed from your saved houses.");
    } catch (error) {
      showError(error.message);
    }
  };

  return (
    <>
      <PageHero
        eyebrow={content.eyebrow}
        image={propertiesContent.hero.image}
        imageAlt={propertiesContent.hero.imageAlt}
        subtitle={content.subtitle}
        title={content.title}
      />
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.01em] text-brand-gold">
                {savedProperties.length} saved
              </p>
              <h2 className="mt-2 font-display text-3xl font-black tracking-[0] text-brand-forest">
                Your saved houses and land
              </h2>
            </div>
            <Button size="sm" to="/properties" variant="outline">
              See More Houses
            </Button>
          </div>

          {isLoading ? (
            <p className="mt-10 text-center text-sm font-semibold text-brand-muted">Loading saved houses...</p>
          ) : savedProperties.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                cta={{ label: "See Houses & Land", href: "/properties" }}
                message={content.emptyBody}
                title={content.emptyTitle}
              />
            </div>
          ) : (
            <div className="mt-8 grid gap-4">
              {savedProperties.map((property) => (
                <SavedPropertyCard key={property.id} onUnsave={handleUnsave} property={property} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

export default SavedHouses;
