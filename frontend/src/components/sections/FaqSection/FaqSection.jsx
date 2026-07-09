import { useState } from "react";
import { ChevronDown } from "react-bootstrap-icons";
import { homeContent } from "../../../content/homeContent.js";
import { useFaqs } from "../../../hooks/useFaqs.js";
import Container from "../../ui/Container/Container.jsx";
import EmptyState from "../../ui/EmptyState/EmptyState.jsx";
import ErrorState from "../../ui/ErrorState/ErrorState.jsx";
import LoadingState from "../../ui/LoadingState/LoadingState.jsx";
import SectionHeader from "../../ui/SectionHeader/SectionHeader.jsx";

const PAGE_SIZE = 6;

function FaqItem({ faq }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-brand-forest/15 first:border-t">
      <button
        aria-controls={`faq-answer-${faq.id}`}
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        <h2 className="text-base font-bold leading-6 text-brand-charcoal sm:text-lg">
          {faq.question}
        </h2>
        <ChevronDown
          aria-hidden="true"
          className={`mt-0.5 h-5 w-5 shrink-0 text-brand-forest transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 pb-5" : "max-h-0"}`}
        id={`faq-answer-${faq.id}`}
      >
        <p className="text-sm leading-7 text-brand-muted">{faq.answer}</p>
      </div>
    </div>
  );
}

function FaqSection() {
  const { faq } = homeContent;
  const { faqs, loading, error, empty } = useFaqs();
  const [showAll, setShowAll] = useState(false);

  const visibleFaqs = showAll ? faqs : faqs.slice(0, PAGE_SIZE);
  const hasMore = faqs.length > PAGE_SIZE;

  return (
    <section className="bg-brand-cream py-20 sm:py-24">
      <Container>
        <SectionHeader
          align="center"
          eyebrow={faq.eyebrow}
          subtitle={faq.subtitle}
          title={faq.title}
          tone="light"
        />

        <div className="mx-auto mt-12 max-w-3xl">
          {loading ? <LoadingState label="Loading questions" /> : null}
          {error ? <ErrorState message={error} /> : null}
          {empty ? <EmptyState message="No questions available yet." /> : null}

          {!loading && !error && !empty ? (
            <>
              {visibleFaqs.map((faq) => (
                <FaqItem faq={faq} key={faq.id} />
              ))}

              {hasMore && !showAll ? (
                <div className="mt-8 text-center">
                  <button
                    className="inline-flex items-center gap-2 border border-brand-forest bg-transparent px-6 py-3 text-sm font-extrabold uppercase tracking-[0.06em] text-brand-forest transition hover:bg-brand-forest hover:text-white focus:outline-none"
                    onClick={() => setShowAll(true)}
                    type="button"
                  >
                    View More Questions
                    <ChevronDown aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

export default FaqSection;
