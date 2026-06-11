import { DoorClosed, Droplet, GeoAlt, Rulers } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import { getFallbackImage } from "../../../utils/getFallbackImage.js";
import { getImageUrl } from "../../../utils/getImageUrl.js";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import Badge from "../Badge/Badge.jsx";
import Button from "../Button/Button.jsx";

function PropertyCard({ property }) {
  const image = getImageUrl(property.image, getFallbackImage("property"));

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = getFallbackImage("property");
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden border border-brand-forest/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(6,63,44,0.12)]">
      <Link className="relative block h-60 overflow-hidden bg-brand-cream" to={`/properties/${property.slug}`}>
        <img
          alt={property.imageAlt || property.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
          onError={handleImageError}
          src={image}
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge tone={property.status === "For Lease" ? "cream" : "gold"}>{property.status}</Badge>
          {property.featured ? <Badge tone="green">Featured</Badge> : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-lg font-black tracking-[0] text-brand-forest">
          {formatCurrency(property.price, property.currency)}
        </p>
        <h3 className="mt-2 text-xl font-black tracking-[0] text-brand-charcoal">
          <Link className="transition hover:text-brand-emerald" to={`/properties/${property.slug}`}>
            {property.title}
          </Link>
        </h3>
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand-muted">
          <GeoAlt aria-hidden="true" className="h-4 w-4 text-brand-gold" />
          <span>{property.location}</span>
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-sm text-brand-muted">
          <span className="flex min-h-10 items-center gap-2 bg-brand-cream/70 px-3">
            <DoorClosed aria-hidden="true" className="h-4 w-4 text-brand-forest" />
            {property.bedrooms || "NA"}
          </span>
          <span className="flex min-h-10 items-center gap-2 bg-brand-cream/70 px-3">
            <Droplet aria-hidden="true" className="h-4 w-4 text-brand-forest" />
            {property.bathrooms || "NA"}
          </span>
          <span className="flex min-h-10 items-center gap-2 bg-brand-cream/70 px-3">
            <Rulers aria-hidden="true" className="h-4 w-4 text-brand-forest" />
            {property.area}
          </span>
        </div>
        <p className="mt-5 line-clamp-3 text-sm leading-6 text-brand-muted">{property.description}</p>
        <Button className="mt-6 self-start" size="sm" to={`/properties/${property.slug}`} variant="dark">
          View Details
        </Button>
      </div>
    </article>
  );
}

export default PropertyCard;
