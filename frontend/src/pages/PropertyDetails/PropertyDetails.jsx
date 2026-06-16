import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, ChevronLeft, ChevronRight, GeoAlt } from "react-bootstrap-icons";
import { Link, useParams } from "react-router-dom";
import ContactCTA from "../../components/sections/ContactCTA/ContactCTA.jsx";
import Badge from "../../components/ui/Badge/Badge.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import Container from "../../components/ui/Container/Container.jsx";
import EmptyState from "../../components/ui/EmptyState/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState/ErrorState.jsx";
import LazyImage from "../../components/ui/LazyImage/LazyImage.jsx";
import PageLoader from "../../components/ui/PageLoader/PageLoader.jsx";
import PropertyCard from "../../components/ui/PropertyCard/PropertyCard.jsx";
import VideoPlayer from "../../components/ui/VideoPlayer/VideoPlayer.jsx";
import { getSiteWhatsAppLink } from "../../config/siteConfig.js";
import { seoContent } from "../../content/seoContent.js";
import { usePageMeta } from "../../hooks/usePageMeta.js";
import { useProperties } from "../../hooks/useProperties.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { getFallbackImage } from "../../utils/getFallbackImage.js";
import { getImageUrl } from "../../utils/getImageUrl.js";

function PropertyDetails() {
  const { slug } = useParams();
  const { property, properties, loading, error } = useProperties({ slug });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const thumbnailRefs = useRef([]);
  const seo = property
    ? {
        title: `${property.title} | Sureboy Realty`,
        description: property.description,
        ogImage: property.image,
      }
    : seoContent.properties;

  usePageMeta(seo);

  const galleryImages = useMemo(() => {
    if (!property) return [];
    const images = [property.image, ...(Array.isArray(property.gallery) ? property.gallery : [])]
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    const uniqueImages = [...new Set(images)];
    return uniqueImages.length ? uniqueImages : [getFallbackImage("property")];
  }, [property]);

  const activeImage = getImageUrl(galleryImages[activeImageIndex] || galleryImages[0], getFallbackImage("property"));
  const hasGalleryControls = galleryImages.length > 1;

  const propertyVideos = (Array.isArray(property?.videos) ? property.videos : [])
    .filter((video) => video?.url)
    .map((video) => ({
      url: getImageUrl(video.url, ""),
      poster: video.poster ? getImageUrl(video.poster, "") : "",
    }));
  const hasMultipleVideos = propertyVideos.length > 1;
  const safeVideoIndex = Math.min(activeVideoIndex, Math.max(propertyVideos.length - 1, 0));
  const activeVideo = propertyVideos[safeVideoIndex] || { url: "", poster: "" };

  const similarProperties = useMemo(() => {
    if (!property) return [];
    return properties.filter((item) => item.slug !== property.slug && item.type === property.type).slice(0, 3);
  }, [properties, property]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [slug, galleryImages.length]);

  useEffect(() => {
    if (!hasGalleryControls) return;
    thumbnailRefs.current[activeImageIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeImageIndex, hasGalleryControls]);

  useEffect(() => {
    setActiveVideoIndex(0);
  }, [slug, propertyVideos.length]);

  const showPreviousVideo = () => {
    if (!propertyVideos.length) return;
    setActiveVideoIndex((i) => (i === 0 ? propertyVideos.length - 1 : i - 1));
  };

  const showNextVideo = () => {
    if (!propertyVideos.length) return;
    setActiveVideoIndex((i) => (i + 1) % propertyVideos.length);
  };

  const showPreviousImage = () => {
    if (!galleryImages.length) return;
    setActiveImageIndex((i) => (i === 0 ? galleryImages.length - 1 : i - 1));
  };

  const showNextImage = () => {
    if (!galleryImages.length) return;
    setActiveImageIndex((i) => (i + 1) % galleryImages.length);
  };

  if (loading) return <PageLoader />;

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

  const enquiryWhatsApp = getSiteWhatsAppLink(
    `Hello Sureboy Realty, I am interested in "${property.title}" and would like to schedule an inspection.`
  );

  const contactLink = `/contact?property=${encodeURIComponent(property.slug)}&ref=${encodeURIComponent(property.title)}`;

  return (
    <>
      {/* Header bar with breadcrumb */}
      <section className="bg-brand-forest pb-10 pt-24 text-white md:pt-28">
        <Container>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50">
            <Link className="transition hover:text-brand-gold" to="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link className="transition hover:text-brand-gold" to="/properties">Properties</Link>
            <span aria-hidden="true">/</span>
            <span className="text-white/80 line-clamp-1">{property.title}</span>
          </nav>

          <Link
            aria-label="Back to properties"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-gold-soft transition hover:text-brand-gold"
            to="/properties"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to Properties
          </Link>
        </Container>
      </section>

      <section className="bg-white pb-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Gallery */}
            <div className="-mt-6 min-w-0 bg-brand-cream shadow-[0_22px_70px_rgba(6,63,44,0.16)]">
              <div className="relative aspect-4/3 overflow-hidden">
                <LazyImage
                  alt={property.imageAlt || property.title}
                  className="h-full w-full object-cover"
                  src={activeImage}
                />
                {hasGalleryControls ? (
                  <>
                    <button
                      aria-label="Previous property image"
                      className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-brand-forest/85 text-white transition hover:bg-brand-gold"
                      onClick={showPreviousImage}
                      type="button"
                    >
                      <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                    </button>
                    <button
                      aria-label="Next property image"
                      className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-brand-forest/85 text-white transition hover:bg-brand-gold"
                      onClick={showNextImage}
                      type="button"
                    >
                      <ChevronRight aria-hidden="true" className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-4 right-4 bg-brand-forest/85 px-3 py-1 text-xs font-extrabold text-white">
                      {activeImageIndex + 1} / {galleryImages.length}
                    </div>
                  </>
                ) : null}
              </div>

              {hasGalleryControls ? (
                <>
                  <div className="flex max-w-full snap-x gap-2 overflow-x-auto bg-white p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {galleryImages.map((galleryImage, index) => (
                      <button
                        aria-current={index === activeImageIndex ? "true" : undefined}
                        aria-label={`Show property image ${index + 1}`}
                        className={`relative h-20 w-28 shrink-0 snap-start overflow-hidden border bg-brand-cream transition sm:h-24 sm:w-32 md:w-36 ${
                          index === activeImageIndex ? "border-brand-gold" : "border-transparent hover:border-brand-forest/30"
                        }`}
                        key={`${galleryImage}-${index}`}
                        onClick={() => setActiveImageIndex(index)}
                        ref={(el) => { thumbnailRefs.current[index] = el; }}
                        type="button"
                      >
                        <LazyImage
                          alt=""
                          className="h-full w-full object-cover"
                          src={getImageUrl(galleryImage, getFallbackImage("property"))}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2 bg-white pb-3">
                    {galleryImages.map((galleryImage, index) => (
                      <button
                        aria-current={index === activeImageIndex ? "true" : undefined}
                        aria-label={`Show property image ${index + 1}`}
                        className={`h-2.5 rounded-full transition ${
                          index === activeImageIndex ? "w-6 bg-brand-gold" : "w-2.5 bg-brand-forest/25 hover:bg-brand-forest/50"
                        }`}
                        key={`dot-${galleryImage}-${index}`}
                        onClick={() => setActiveImageIndex(index)}
                        type="button"
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* Property info */}
            <div className="py-8 lg:py-10">
              <div className="flex flex-wrap gap-2">
                <Badge>{property.status}</Badge>
                <Badge tone="cream">{property.type}</Badge>
              </div>
              <h1 className="mt-5 text-balance text-4xl font-black tracking-normal text-brand-forest sm:text-5xl">
                {property.title}
              </h1>
              <p className="mt-4 flex items-center gap-2 text-base font-semibold text-brand-muted">
                <GeoAlt aria-hidden="true" className="h-5 w-5 text-brand-gold" />
                {property.location}
              </p>
              <p className="mt-6 text-3xl font-black tracking-normal text-brand-charcoal">
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
              <Button className="mt-8" icon={ArrowRight} to={contactLink} variant="primary">
                Enquire About This Property
              </Button>
            </div>
          </div>

          {/* Features + Inspection CTA */}
          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <h2 className="text-2xl font-black tracking-normal text-brand-forest">Property Features</h2>
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
              <h2 className="text-2xl font-black tracking-normal">Need a private inspection?</h2>
              <p className="mt-3 text-sm leading-7 text-white/74">
                Send an enquiry and Sureboy Realty will confirm availability, inspection timing, and the next step.
              </p>
              <div className="mt-6 grid gap-3">
                <Button to={contactLink} variant="primary">
                  Schedule Inspection
                </Button>
                <a
                  className="flex items-center justify-center gap-2 border border-white/20 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.06em] text-white transition hover:border-[#25d366] hover:text-[#25d366]"
                  href={enquiryWhatsApp}
                  rel="noreferrer"
                  target="_blank"
                >
                  Or message us on WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Videos */}
          {propertyVideos.length ? (
            <div className="mt-12">
              <h2 className="text-2xl font-black tracking-normal text-brand-forest">
                {propertyVideos.length > 1 ? "Property Videos" : "Property Video"}
              </h2>
              <div className="relative mt-5 overflow-hidden">
                <VideoPlayer key={activeVideo.url} poster={activeVideo.poster} src={activeVideo.url} />
                {hasMultipleVideos ? (
                  <>
                    <button
                      aria-label="Previous property video"
                      className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-brand-forest/85 text-white transition hover:bg-brand-gold"
                      onClick={showPreviousVideo}
                      type="button"
                    >
                      <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                    </button>
                    <button
                      aria-label="Next property video"
                      className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-brand-forest/85 text-white transition hover:bg-brand-gold"
                      onClick={showNextVideo}
                      type="button"
                    >
                      <ChevronRight aria-hidden="true" className="h-5 w-5" />
                    </button>
                    <div className="absolute right-4 top-4 bg-brand-forest/85 px-3 py-1 text-xs font-extrabold text-white">
                      {safeVideoIndex + 1} / {propertyVideos.length}
                    </div>
                  </>
                ) : null}
              </div>
              {hasMultipleVideos ? (
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {propertyVideos.map((video, index) => (
                    <button
                      aria-label={`Show property video ${index + 1}`}
                      className={`h-2.5 w-2.5 rounded-full transition ${
                        index === safeVideoIndex ? "bg-brand-gold" : "bg-brand-forest/25 hover:bg-brand-forest/50"
                      }`}
                      key={`${video.url}-${index}`}
                      onClick={() => setActiveVideoIndex(index)}
                      type="button"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Similar properties */}
          {similarProperties.length > 0 ? (
            <div className="mt-16">
              <h2 className="text-2xl font-black tracking-normal text-brand-forest">
                Similar {property.type} Properties
              </h2>
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
