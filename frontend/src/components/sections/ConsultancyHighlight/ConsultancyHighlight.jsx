import { ArrowRight, CheckCircle } from "react-bootstrap-icons";
import { homeContent } from "../../../content/homeContent.js";
import { getFallbackImage } from "../../../utils/getFallbackImage.js";
import { getImageUrl } from "../../../utils/getImageUrl.js";
import Button from "../../ui/Button/Button.jsx";
import Container from "../../ui/Container/Container.jsx";

function ConsultancyHighlight() {
  const content = homeContent.consultancyHighlight;
  const image = getImageUrl("/images/services/consultancy-highlight.webp", getFallbackImage("service"));

  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1fr]">
          <div className="overflow-hidden bg-brand-cream">
            <img
              alt="Modern real estate investment consultation setting"
              className="aspect-[4/3] h-full w-full object-cover"
              loading="lazy"
              src={image}
            />
          </div>
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-gold">{content.eyebrow}</p>
            <h2 className="mt-3 text-balance text-3xl font-black tracking-[0] text-brand-forest sm:text-4xl">
              {content.title}
            </h2>
            <p className="mt-5 text-base leading-8 text-brand-muted">{content.body}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {content.points.map((point) => (
                <div className="border border-brand-forest/10 bg-brand-cream/60 p-4" key={point}>
                  <CheckCircle aria-hidden="true" className="h-5 w-5 text-brand-gold" />
                  <p className="mt-3 text-sm font-extrabold text-brand-forest">{point}</p>
                </div>
              ))}
            </div>
            <Button className="mt-8" icon={ArrowRight} to={content.cta.href} variant="dark">
              {content.cta.label}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default ConsultancyHighlight;
