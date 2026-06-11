import { ArrowRight, CheckCircle } from "react-bootstrap-icons";
import { homeContent } from "../../../content/homeContent.js";
import Button from "../../ui/Button/Button.jsx";
import Container from "../../ui/Container/Container.jsx";

function PropertyManagementHighlight() {
  const content = homeContent.managementHighlight;

  return (
    <section className="bg-brand-cream/50 py-20 sm:py-24">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-gold">{content.eyebrow}</p>
            <h2 className="mt-3 text-balance text-3xl font-black tracking-[0] text-brand-forest sm:text-4xl">
              {content.title}
            </h2>
            <p className="mt-5 text-base leading-8 text-brand-muted">{content.body}</p>
            <ul className="mt-7 grid gap-3">
              {content.points.map((point) => (
                <li className="flex items-center gap-3 font-extrabold text-brand-forest" key={point}>
                  <CheckCircle aria-hidden="true" className="h-5 w-5 text-brand-gold" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-8" icon={ArrowRight} to={content.cta.href} variant="dark">
              {content.cta.label}
            </Button>
          </div>
          <div className="bg-brand-forest p-6 text-white shadow-[0_22px_70px_rgba(6,63,44,0.18)]">
            <div className="border border-white/12 p-6">
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-gold-soft">Owner Focus</p>
              <p className="mt-4 text-3xl font-black tracking-[0]">Less stress. Better oversight. Stronger property value.</p>
              <p className="mt-5 text-sm leading-7 text-white/72">
                Management support is built for owners who need dependable communication, practical coordination, and a clearer view of their property performance.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default PropertyManagementHighlight;
