import PageHero from "../../components/sections/PageHero/PageHero.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import Container from "../../components/ui/Container/Container.jsx";
import EmptyState from "../../components/ui/EmptyState/EmptyState.jsx";
import { propertiesContent } from "../../content/propertiesContent.js";
import { usePageMeta } from "../../hooks/usePageMeta.js";

function SavedHouses() {
  const content = propertiesContent.savedHouses;

  usePageMeta({
    title: "Saved Houses | Sureboy Realty",
    description: content.subtitle,
    ogImage: propertiesContent.hero.image,
  });

  return (
    <>
      <PageHero
        eyebrow={content.eyebrow}
        image={propertiesContent.hero.image}
        imageAlt={propertiesContent.hero.imageAlt}
        subtitle={content.subtitle}
        title={content.title}
      />
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <EmptyState
            cta={{ label: "Browse Properties", href: "/properties" }}
            message={content.emptyBody}
            title={content.emptyTitle}
          />
          <div className="mt-8 text-center">
            <Button to="/projects" variant="dark">
              View Projects
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}

export default SavedHouses;
