import { CameraVideo, Instagram, Facebook, PlayCircle } from "react-bootstrap-icons";
import { homeContent } from "../../../content/homeContent.js";
import Button from "../../ui/Button/Button.jsx";
import Container from "../../ui/Container/Container.jsx";
import SectionHeader from "../../ui/SectionHeader/SectionHeader.jsx";

const topics = [
  { icon: PlayCircle, label: "Property Tours" },
  { icon: CameraVideo, label: "Land Verification Tips" },
  { icon: PlayCircle, label: "Investment Advice" },
  { icon: CameraVideo, label: "Market Updates" },
];

function VideoSection() {
  const { videoSection } = homeContent;

  return (
    <section className="bg-brand-forest py-20 text-white sm:py-24">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeader
              align="left"
              eyebrow={videoSection.eyebrow}
              subtitle={videoSection.subtitle}
              title={videoSection.title}
              tone="dark"
            />

            <div className="mt-8 grid grid-cols-2 gap-3">
              {topics.map(({ icon: Icon, label }) => (
                <div
                  className="flex items-center gap-3 border border-white/12 bg-white/7 px-4 py-3"
                  key={label}
                >
                  <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-brand-gold" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Button icon={Instagram} iconPosition="left" to={videoSection.cta.href} variant="primary">
                {videoSection.cta.label}
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-6 border border-white/12 bg-white/5 p-10 text-center backdrop-blur">
            <span className="grid h-20 w-20 place-items-center rounded-full border-2 border-brand-gold/40 bg-brand-gold/10">
              <PlayCircle aria-hidden="true" className="h-10 w-10 text-brand-gold" />
            </span>
            <div>
              <p className="text-xl font-black tracking-[0]">{videoSection.comingSoonLabel}</p>
              <p className="mt-3 text-sm leading-6 text-white/70">{videoSection.comingSoonBody}</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                aria-label="Follow on Instagram"
                className="text-white/60 transition-colors hover:text-brand-gold"
                href="https://www.instagram.com/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Instagram aria-hidden="true" className="h-6 w-6" />
              </a>
              <a
                aria-label="Follow on Facebook"
                className="text-white/60 transition-colors hover:text-brand-gold"
                href="https://www.facebook.com/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Facebook aria-hidden="true" className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default VideoSection;
