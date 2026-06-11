import { ArrowRight } from "react-bootstrap-icons";
import { getFallbackImage } from "../../../utils/getFallbackImage.js";
import { getImageUrl } from "../../../utils/getImageUrl.js";
import Button from "../../ui/Button/Button.jsx";
import Container from "../../ui/Container/Container.jsx";

function PageHero({ eyebrow, title, subtitle, image, imageAlt, cta }) {
  const heroImage = getImageUrl(image, getFallbackImage("hero"));

  return (
    <section className="relative isolate min-h-[52vh] overflow-hidden bg-brand-forest pb-16 pt-28 text-white sm:pb-20 md:pt-32" data-page-hero>
      <img
        alt={imageAlt || title}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        fetchPriority="high"
        src={heroImage}
      />
      <div className="hero-overlay absolute inset-0 -z-10" />
      <Container>
        <div className="max-w-4xl">
          {eyebrow ? (
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-gold-soft">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-4 text-balance text-4xl font-black tracking-[0] sm:text-5xl">
            {title}
          </h1>
          {subtitle ? <p className="mt-5 max-w-3xl text-lg leading-8 text-white/82">{subtitle}</p> : null}
          {cta ? (
            <Button className="mt-8" icon={ArrowRight} to={cta.href} variant={cta.variant || "primary"}>
              {cta.label}
            </Button>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

export default PageHero;
