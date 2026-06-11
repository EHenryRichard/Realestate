import { getIcon } from "../../../config/iconConfig.js";
import { trustIndicatorsData } from "../../../data/trustIndicatorsData.js";
import Container from "../../ui/Container/Container.jsx";

function TrustIndicators() {
  return (
    <section className="bg-brand-cream/70 py-8">
      <Container>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustIndicatorsData.map((indicator) => {
            const Icon = getIcon(indicator.iconKey, "checkCircle");

            return (
              <article className="flex items-center gap-4 bg-white p-5 shadow-sm" key={indicator.id}>
                <span className="grid h-12 w-12 shrink-0 place-items-center bg-brand-forest text-brand-gold">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-base font-black tracking-[0] text-brand-forest">{indicator.label}</h2>
                  <p className="mt-1 text-sm text-brand-muted">{indicator.value}</p>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export default TrustIndicators;
