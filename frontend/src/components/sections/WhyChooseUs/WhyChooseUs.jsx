import { getIcon } from "../../../config/iconConfig.js";
import { homeContent } from "../../../content/homeContent.js";
import { whyChooseUsData } from "../../../data/whyChooseUsData.js";
import Container from "../../ui/Container/Container.jsx";
import SectionHeader from "../../ui/SectionHeader/SectionHeader.jsx";

function WhyChooseUs() {
  const section = homeContent.sections.whyChooseUs;

  return (
    <section className="diagonal-accent overflow-hidden bg-brand-forest py-20 text-white sm:py-24">
      <Container>
        <SectionHeader
          align="center"
          eyebrow={section.eyebrow}
          subtitle={section.subtitle}
          title={section.title}
          tone="dark"
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {whyChooseUsData.map((item) => {
            const Icon = getIcon(item.iconKey, "checkCircle");

            return (
              <article className="border border-white/12 bg-white/7 p-6 backdrop-blur" key={item.id}>
                <span className="grid h-12 w-12 place-items-center bg-brand-gold text-brand-charcoal">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-black tracking-[0]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/74">{item.body}</p>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export default WhyChooseUs;
