import { StarFill } from "react-bootstrap-icons";
import { getFallbackImage } from "../../../utils/getFallbackImage.js";
import { getImageUrl } from "../../../utils/getImageUrl.js";

function TestimonialCard({ testimonial }) {
  const avatar = getImageUrl(testimonial.avatar, getFallbackImage("avatar"));

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = getFallbackImage("avatar");
  };

  return (
    <article className="h-full border border-brand-forest/10 bg-white p-6 shadow-sm">
      <div className="flex gap-1 text-brand-gold" aria-label={`${testimonial.rating} out of 5 stars`}>
        {Array.from({ length: testimonial.rating }).map((_, index) => (
          <StarFill aria-hidden="true" className="h-4 w-4" key={index} />
        ))}
      </div>
      <p className="mt-5 text-base leading-7 text-brand-charcoal">"{testimonial.quote}"</p>
      <div className="mt-6 flex items-center gap-3">
        <img
          alt={`${testimonial.clientName} avatar`}
          className="h-12 w-12 object-cover"
          loading="lazy"
          onError={handleImageError}
          src={avatar}
        />
        <div>
          <h3 className="font-black tracking-[0] text-brand-forest">{testimonial.clientName}</h3>
          <p className="text-sm text-brand-muted">
            {testimonial.clientType} - {testimonial.serviceUsed}
          </p>
        </div>
      </div>
    </article>
  );
}

export default TestimonialCard;
