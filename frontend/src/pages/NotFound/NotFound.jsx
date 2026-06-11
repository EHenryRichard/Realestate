import Button from "../../components/ui/Button/Button.jsx";
import Container from "../../components/ui/Container/Container.jsx";
import { seoContent } from "../../content/seoContent.js";
import { usePageMeta } from "../../hooks/usePageMeta.js";

function NotFound() {
  usePageMeta(seoContent.notFound);

  return (
    <section className="grid min-h-[60vh] place-items-center bg-brand-cream/45 py-20">
      <Container size="narrow">
        <div className="text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-gold">404</p>
          <h1 className="mt-4 text-balance text-4xl font-black tracking-[0] text-brand-forest sm:text-5xl">Page not found</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-brand-muted">
            The page you requested does not exist. Return home or browse current property opportunities.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button to="/" variant="primary">
              Go Home
            </Button>
            <Button to="/properties" variant="dark">
              Browse Properties
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default NotFound;
