import PageHero from "../../components/sections/PageHero/PageHero.jsx";
import Container from "../../components/ui/Container/Container.jsx";
import EmptyState from "../../components/ui/EmptyState/EmptyState.jsx";
import { propertiesContent } from "../../content/propertiesContent.js";
import { usePageMeta } from "../../hooks/usePageMeta.js";

function Projects() {
  const content = propertiesContent.projects;

  usePageMeta({
    title: "Projects | Sureboy Realty",
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
            cta={{ label: "Speak With an Agent", href: "/contact" }}
            message={content.emptyBody}
            title={content.emptyTitle}
          />
        </Container>
      </section>
    </>
  );
}

export default Projects;
