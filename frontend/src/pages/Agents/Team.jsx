import { Link } from "react-router-dom";
import { EnvelopeFill, TelephoneFill } from "react-bootstrap-icons";
import { seoContent } from "../../content/seoContent.js";
import { useAgents } from "../../hooks/useAgents.js";
import { usePageMeta } from "../../hooks/usePageMeta.js";
import { getSiteWhatsAppLink } from "../../config/siteConfig.js";
import Container from "../../components/ui/Container/Container.jsx";
import EmptyState from "../../components/ui/EmptyState/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState/ErrorState.jsx";
import LoadingState from "../../components/ui/LoadingState/LoadingState.jsx";
import PageHero from "../../components/sections/PageHero/PageHero.jsx";

const LOGO = "/images/logo/logo.png";

function AgentAvatar({ agent }) {
  if (agent.photo) {
    return (
      <img
        alt={agent.fullName}
        className="h-28 w-28 rounded-full object-cover ring-4 ring-brand-gold/30"
        src={agent.photo}
      />
    );
  }
  return (
    <div className="grid h-28 w-28 place-items-center rounded-full bg-brand-forest ring-4 ring-brand-gold/30">
      <img
        alt={agent.fullName}
        className="h-16 w-16 object-contain brightness-0 invert opacity-70"
        src={LOGO}
      />
    </div>
  );
}

function AgentCard({ agent }) {
  const href = agent.slug ? `/agents/${agent.slug}` : null;

  return (
    <div className="flex flex-col items-center bg-white border border-brand-forest/10 p-8 text-center transition hover:-translate-y-1 hover:shadow-xl">
      {href ? (
        <Link to={href}>
          <AgentAvatar agent={agent} />
        </Link>
      ) : (
        <AgentAvatar agent={agent} />
      )}

      <div className="mt-5 flex-1">
        {href ? (
          <Link className="block font-extrabold text-lg text-brand-forest hover:text-brand-gold transition" to={href}>
            {agent.fullName}
          </Link>
        ) : (
          <p className="font-extrabold text-lg text-brand-forest">{agent.fullName}</p>
        )}
        {agent.title && (
          <p className="mt-1 text-xs font-extrabold uppercase tracking-widest text-brand-gold">{agent.title}</p>
        )}
        {agent.bio && (
          <p className="mt-4 text-sm leading-7 text-brand-muted line-clamp-3">{agent.bio}</p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2 w-full">
        {agent.phone && (
          <a
            className="flex items-center justify-center gap-2 border border-brand-forest/15 px-4 py-2.5 text-sm font-extrabold text-brand-forest transition hover:bg-brand-forest hover:text-white"
            href={`tel:${agent.phone}`}
          >
            <TelephoneFill aria-hidden="true" className="h-4 w-4" />
            {agent.phone}
          </a>
        )}
        <a
          className="flex items-center justify-center gap-2 bg-brand-forest px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-gold hover:text-brand-charcoal"
          href={getSiteWhatsAppLink(`Hello, I'd like to speak with ${agent.fullName} at Sureboy Realty.`)}
          rel="noreferrer"
          target="_blank"
        >
          WhatsApp {agent.fullName.split(" ")[0]}
        </a>
      </div>
    </div>
  );
}

function Team() {
  usePageMeta(seoContent.team);

  const { agents, loading, error, empty } = useAgents();

  return (
    <>
      <PageHero
        eyebrow="Meet the team"
        subtitle="Experienced professionals committed to finding you the right property in Warri and across Delta State."
        title="The People Behind Sureboy Realty"
      />

      <section className="bg-brand-cream py-16 sm:py-24">
        <Container>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : empty ? (
            <EmptyState message="No team members to show at this time." />
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <AgentCard agent={agent} key={agent.id} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

export default Team;
