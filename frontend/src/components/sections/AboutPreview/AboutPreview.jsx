import { ArrowRight } from "react-bootstrap-icons";
import { homeContent } from "../../../content/homeContent.js";
import { getFallbackImage } from "../../../utils/getFallbackImage.js";
import { getImageUrl } from "../../../utils/getImageUrl.js";
import Button from "../../ui/Button/Button.jsx";
import Container from "../../ui/Container/Container.jsx";

function AboutPreview() {
  const content = homeContent.aboutPreview;
  const image = getImageUrl("/images/about/about-preview.webp", getFallbackImage("gallery"));

  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1fr]">
          <div className="relative overflow-hidden bg-brand-cream">
            <img
              alt="Premium residential building showing Sureboy Realty standards"
              className="aspect-[4/3] h-full w-full object-cover"
              loading="lazy"
              src={image}
            />
            <div className="absolute bottom-5 left-5 right-5 bg-white/92 p-5 shadow-lg backdrop-blur">
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-gold">Sureboy Standard</p>
              <p className="mt-2 text-lg font-black tracking-[0] text-brand-forest">Clear support from first message to decision.</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-gold">{content.eyebrow}</p>
            <h2 className="mt-3 text-balance text-3xl font-black tracking-[0] text-brand-forest sm:text-4xl">
              {content.title}
            </h2>
            <p className="mt-5 text-base leading-8 text-brand-muted">{content.body}</p>
            <Button className="mt-7" icon={ArrowRight} to={content.cta.href} variant="dark">
              {content.cta.label}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default AboutPreview;
