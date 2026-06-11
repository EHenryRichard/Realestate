import { ArrowRight, CheckCircle, GeoAlt } from "react-bootstrap-icons";
import { Link, useParams } from "react-router-dom";
import ContactCTA from "../../components/sections/ContactCTA/ContactCTA.jsx";
import Badge from "../../components/ui/Badge/Badge.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import Container from "../../components/ui/Container/Container.jsx";
import EmptyState from "../../components/ui/EmptyState/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState/ErrorState.jsx";
import PageLoader from "../../components/ui/PageLoader/PageLoader.jsx";
import PropertyCard from "../../components/ui/PropertyCard/PropertyCard.jsx";
import { seoContent } from "../../content/seoContent.js";
import { usePageMeta } from "../../hooks/usePageMeta.js";
import { useProperties } from "../../hooks/useProperties.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { getFallbackImage } from "../../utils/getFallbackImage.js";
import { getImageUrl } from "../../utils/getImageUrl.js";

function PropertyDetails() {
  const { slug } = useParams();
  const { property, properties, loading, error } = useProperties({ slug });
  const seo = property
    ? {
        title: `${property.title} | Sureboy Realty`,
        description: property.description,
        ogImage: property.image,
      }
    : seoContent.properties;

  usePageMeta(seo);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <section className="bg-white py-16">
        <Container>
          <ErrorState message={error} title="Could not load property" />
        </Container>
      </section>
    );
  }

  if (!property) {
    return (
      <section className="bg-white py-16">
        <Container>
          <EmptyState
            cta={{ label: "Browse Properties", href: "/properties" }}
            message="The property you are looking for may have moved or is no longer available."
            title="Property not found"
          />
        </Container>
      </section>
    );
  }

  const image = getImageUrl(property.image, getFallbackImage("property"));
  const videoUrl = property.videoUrl ? getImageUrl(property.videoUrl, "") : "";
  const videoPoster = property.videoPoster ? getImageUrl(property.videoPoster, "") : "";
  const similarProperties = properties
    .filter((item) => item.slug !== property.slug && item.type === property.type)
    .slice(0, 3);

  return (
    <>
      <section className="bg-brand-forest py-10 text-white">
        <Container>
          <Link className="text-sm font-extrabold text-brand-gold-soft transition hover:text-brand-gold" to="/properties">
            Back to properties
          </Link>
        </Container>
      </section>

      <section className="bg-white pb-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="-mt-6 overflow-hidden bg-brand-cream shadow-[0_22px_70px_rgba(6,63,44,0.16)]">
              <img alt={property.imageAlt || property.title} className="aspect-[4/3] h-full w-full object-cover" src={image} />
            </div>
            <div className="py-8 lg:py-10">
              <div className="flex flex-wrap gap-2">
                <Badge>{property.status}</Badge>
                <Badge tone="cream">{property.type}</Badge>
              </div>
              <h1 className="mt-5 text-balance text-4xl font-black tracking-[0] text-brand-forest sm:text-5xl">{property.title}</h1>
              <p className="mt-4 flex items-center gap-2 text-base font-semibold text-brand-muted">
                <GeoAlt aria-hidden="true" className="h-5 w-5 text-brand-gold" />
                {property.location}
              </p>
              <p className="mt-6 text-3xl font-black tracking-[0] text-brand-charcoal">
                {formatCurrency(property.price, property.currency)}
              </p>
              <p className="mt-5 text-base leading-8 text-brand-muted">{property.description}</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="bg-brand-cream/70 p-4">
                  <p className="text-sm font-semibold text-brand-muted">Bedrooms</p>
                  <p className="mt-1 text-xl font-black text-brand-forest">{property.bedrooms || "NA"}</p>
                </div>
                <div className="bg-brand-cream/70 p-4">
                  <p className="text-sm font-semibold text-brand-muted">Bathrooms</p>
                  <p className="mt-1 text-xl font-black text-brand-forest">{property.bathrooms || "NA"}</p>
                </div>
                <div className="bg-brand-cream/70 p-4">
                  <p className="text-sm font-semibold text-brand-muted">Area</p>
                  <p className="mt-1 text-xl font-black text-brand-forest">{property.area}</p>
                </div>
              </div>
              <Button className="mt-8" icon={ArrowRight} to="/contact" variant="primary">
                Enquire About This Property
              </Button>
            </div>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <h2 className="text-2xl font-black tracking-[0] text-brand-forest">Property Features</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {property.features.map((feature) => (
                  <div className="flex items-center gap-3 border border-brand-forest/10 bg-brand-cream/45 p-4" key={feature}>
                    <CheckCircle aria-hidden="true" className="h-5 w-5 text-brand-gold" />
                    <span className="font-semibold text-brand-forest">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-brand-forest p-6 text-white">
              <h2 className="text-2xl font-black tracking-[0]">Need a private inspection?</h2>
              <p className="mt-3 text-sm leading-7 text-white/74">
                Send an enquiry and Sureboy Realty will help you confirm availability, inspection timing, and the next practical step.
              </p>
              <Button className="mt-6" to="/contact" variant="primary">
                Schedule Inspection
              </Button>
            </div>
          </div>

          {videoUrl ? (
            <div className="mt-12">
              <h2 className="text-2xl font-black tracking-[0] text-brand-forest">Property Video</h2>
              <video
                className="mt-5 aspect-video w-full bg-brand-forest object-cover"
                controls
                poster={videoPoster || undefined}
                src={videoUrl}
              />
            </div>
          ) : null}

          {similarProperties.length > 0 ? (
            <div className="mt-16">
              <h2 className="text-2xl font-black tracking-[0] text-brand-forest">Similar Properties</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {similarProperties.map((item) => (
                  <PropertyCard key={item.id} property={item} />
                ))}
              </div>
            </div>
          ) : null}
        </Container>
      </section>

      <ContactCTA />
    </>
  );
}

export default PropertyDetails;
