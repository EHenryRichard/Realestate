import { ChatDots, Houses } from "react-bootstrap-icons";
import { homeContent } from "../../../content/homeContent.js";
import Button from "../../ui/Button/Button.jsx";
import Container from "../../ui/Container/Container.jsx";

function ContactCTA() {
  const content = homeContent.contactCta;

  return (
    <section className="bg-brand-forest py-16 text-white">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-balance text-3xl font-black tracking-[0] sm:text-4xl">{content.title}</h2>
            <p className="mt-4 text-base leading-7 text-white/76">{content.body}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <Button icon={ChatDots} iconPosition="left" to={content.primaryCta.href} variant="primary">
              {content.primaryCta.label}
            </Button>
            <Button icon={Houses} iconPosition="left" to={content.secondaryCta.href} variant="outline">
              {content.secondaryCta.label}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default ContactCTA;
