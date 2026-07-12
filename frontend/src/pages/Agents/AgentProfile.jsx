import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, EnvelopeFill, TelephoneFill } from "react-bootstrap-icons";
import { teamApi } from "../../api/teamApi.js";
import { apiConfig } from "../../config/apiConfig.js";
import { getSiteWhatsAppLink } from "../../config/siteConfig.js";
import { usePageMeta } from "../../hooks/usePageMeta.js";
import Container from "../../components/ui/Container/Container.jsx";
import ErrorState from "../../components/ui/ErrorState/ErrorState.jsx";
import LoadingState from "../../components/ui/LoadingState/LoadingState.jsx";

const LOGO = "/images/logo/logo.png";

function AgentProfile() {
  const { slug } = useParams();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (!apiConfig.useApi) {
          if (active) setAgent({ fullName: "Agent Name", title: "Property Agent", bio: "Bio here.", slug });
          return;
        }
        const res = await teamApi.getBySlug(slug);
        const data = res?.data?.data || res?.data || null;
        if (active) setAgent(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [slug]);

  usePageMeta(
    agent
      ? {
          title: `${agent.fullName} | Sureboy Realty`,
          description: agent.bio || `Meet ${agent.fullName}, a property professional at Sureboy Realty.`,
          ogImage: agent.photo || "/og-image.jpg",
        }
      : { title: "Agent Profile | Sureboy Realty", description: "", ogImage: "/og-image.jpg" }
  );

  if (loading) {
    return (
      <div className="py-32">
        <LoadingState label="Loading profile" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="py-32">
        <ErrorState message={error || "Agent not found."} />
      </div>
    );
  }

  return (
    <section className="bg-brand-cream py-16 sm:py-24">
      <Container>
        <Link
          className="mb-10 inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-brand-forest transition hover:text-brand-gold"
          to="/agents"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to Team
        </Link>

        <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
          {/* Photo + contact card */}
          <div className="flex flex-col items-center gap-6 lg:items-start">
            {agent.photo ? (
              <img
                alt={agent.fullName}
                className="h-44 w-44 rounded-full object-cover ring-4 ring-brand-gold/30"
                src={agent.photo}
              />
            ) : (
              <div className="grid h-44 w-44 place-items-center rounded-full bg-brand-forest ring-4 ring-brand-gold/30">
                <img
                  alt={agent.fullName}
                  className="h-24 w-24 object-contain brightness-0 invert opacity-70"
                  src={LOGO}
                />
              </div>
            )}

            <div className="flex flex-col gap-2 w-full max-w-xs">
              {agent.phone && (
                <a
                  className="flex items-center justify-center gap-2 border border-brand-forest/15 px-5 py-3 text-sm font-extrabold text-brand-forest transition hover:bg-brand-forest hover:!text-white"
                  href={`tel:${agent.phone}`}
                >
                  <TelephoneFill aria-hidden="true" className="h-4 w-4" />
                  {agent.phone}
                </a>
              )}
              {agent.email && (
                <a
                  className="flex items-center justify-center gap-2 border border-brand-forest/15 px-5 py-3 text-sm font-extrabold text-brand-forest transition hover:bg-brand-forest hover:!text-white"
                  href={`mailto:${agent.email}`}
                >
                  <EnvelopeFill aria-hidden="true" className="h-4 w-4" />
                  {agent.email}
                </a>
              )}
              <a
                className="flex items-center justify-center gap-2 bg-brand-forest px-5 py-3 text-sm font-extrabold text-white transition hover:bg-brand-emerald hover:!text-white"
                href={getSiteWhatsAppLink(`Hello, I'd like to speak with ${agent.fullName} at Sureboy Realty.`)}
                rel="noreferrer"
                target="_blank"
              >
                WhatsApp {agent.fullName.split(" ")[0]}
              </a>
            </div>
          </div>

          {/* Bio */}
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-brand-gold">Sureboy Realty</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-forest sm:text-4xl">
              {agent.fullName}
            </h1>
            {agent.title && (
              <p className="mt-2 text-base font-extrabold text-brand-muted">{agent.title}</p>
            )}
            {agent.bio && (
              <div className="mt-8 border-t border-brand-forest/10 pt-8">
                <h2 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-brand-forest">About</h2>
                <p className="text-base leading-8 text-brand-muted">{agent.bio}</p>
              </div>
            )}
            <div className="mt-8 border-t border-brand-forest/10 pt-8">
              <Link
                className="inline-flex items-center gap-2 bg-brand-gold px-6 py-3 text-sm font-extrabold uppercase tracking-wider text-brand-charcoal transition hover:bg-brand-forest hover:text-white"
                to={`/contact?agent=${agent.slug || agent.id}&ref=${encodeURIComponent(agent.fullName)}`}
              >
                Request a Consultation
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default AgentProfile;
