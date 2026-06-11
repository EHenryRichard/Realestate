import { homeContent } from "../../../content/homeContent.js";
import { useTestimonials } from "../../../hooks/useTestimonials.js";
import Container from "../../ui/Container/Container.jsx";
import EmptyState from "../../ui/EmptyState/EmptyState.jsx";
import ErrorState from "../../ui/ErrorState/ErrorState.jsx";
import LoadingState from "../../ui/LoadingState/LoadingState.jsx";
import SectionHeader from "../../ui/SectionHeader/SectionHeader.jsx";
import TestimonialCard from "../../ui/TestimonialCard/TestimonialCard.jsx";

function Testimonials() {
  const { testimonials, loading, error, empty } = useTestimonials();
  const section = homeContent.sections.testimonials;

  return (
    <section className="bg-brand-cream/45 py-20 sm:py-24">
      <Container>
        <SectionHeader align="center" eyebrow={section.eyebrow} subtitle={section.subtitle} title={section.title} />
        <div className="mt-10">
          {loading ? <LoadingState label="Loading testimonials" /> : null}
          {error ? <ErrorState message={error} title="Could not load testimonials" /> : null}
          {empty ? <EmptyState message="Client stories will appear here soon." title="No testimonials available" /> : null}
          {!loading && !error && !empty ? (
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

export default Testimonials;
