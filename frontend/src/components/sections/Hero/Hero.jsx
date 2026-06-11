import { ArrowRight, ChatDots } from "react-bootstrap-icons";
import { homeContent } from "../../../content/homeContent.js";
import { trustIndicatorsData } from "../../../data/trustIndicatorsData.js";
import { getFallbackImage } from "../../../utils/getFallbackImage.js";
import { getImageUrl } from "../../../utils/getImageUrl.js";
import Button from "../../ui/Button/Button.jsx";
import Container from "../../ui/Container/Container.jsx";

function Hero() {
  const { hero } = homeContent;
  const image = getImageUrl(hero.image, getFallbackImage("hero"));

  return (
    <section className="relative isolate min-h-svh overflow-hidden bg-brand-forest text-white" data-page-hero>
      <img
        alt={hero.imageAlt}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        fetchPriority="high"
        src={image}
      />
      <div className="hero-overlay absolute inset-0 -z-10" />
      <Container className="grid min-h-svh items-center pb-16 pt-28 md:pt-32">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex border-b border-brand-gold/50  py-2 text-xl font-extrabold uppercase tracking-[0.16em] text-brand-gold-soft">
            {hero.eyebrow}
          </p>
          <h1 className="text-balance text-4xl font-black tracking-[0] sm:text-5xl lg:text-7xl">
            {hero.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82 sm:text-xl">{hero.subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button icon={ArrowRight} size="lg" to={hero.primaryCta.href} variant="primary">
              {hero.primaryCta.label}
            </Button>
            <Button icon={ChatDots} iconPosition="left" size="lg" to={hero.secondaryCta.href} variant="outline">
              {hero.secondaryCta.label}
            </Button>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {trustIndicatorsData.slice(0, 3).map((item) => (
              <div className="border border-white/14 bg-white/8 p-4 backdrop-blur" key={item.id}>
                <p className="text-sm font-extrabold text-brand-gold-soft">{item.label}</p>
                <p className="mt-1 text-sm text-white/72">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

export default Hero;
