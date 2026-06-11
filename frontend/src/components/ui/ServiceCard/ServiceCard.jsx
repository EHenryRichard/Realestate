import { getIcon } from "../../../config/iconConfig.js";
import { getFallbackImage } from "../../../utils/getFallbackImage.js";
import { getImageUrl } from "../../../utils/getImageUrl.js";
import Button from "../Button/Button.jsx";

function ServiceCard({ service }) {
  const Icon = getIcon(service.iconKey, "building");
  const image = getImageUrl(service.image, getFallbackImage("service"));

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = getFallbackImage("service");
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden border border-brand-forest/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(6,63,44,0.12)]">
      <div className="relative h-44 overflow-hidden bg-brand-cream">
        <img
          alt={`${service.title} service`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
          onError={handleImageError}
          src={image}
        />
        <div className="absolute left-4 top-4 grid h-12 w-12 place-items-center bg-brand-forest text-brand-gold shadow-lg">
          <Icon aria-hidden="true" className="h-6 w-6" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-black tracking-[0] text-brand-forest">{service.title}</h3>
        <p className="mt-3 text-sm leading-6 text-brand-muted">{service.shortDescription}</p>
        <ul className="mt-5 grid gap-2 text-sm text-brand-charcoal">
          {service.features.slice(0, 3).map((feature) => (
            <li className="flex items-center gap-2" key={feature}>
              <span className="h-1.5 w-1.5 bg-brand-gold" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button className="mt-6 self-start" size="sm" to={service.link} variant="ghost">
          {service.ctaText}
        </Button>
      </div>
    </article>
  );
}

export default ServiceCard;
