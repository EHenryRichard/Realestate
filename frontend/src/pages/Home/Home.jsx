import AboutPreview from "../../components/sections/AboutPreview/AboutPreview.jsx";
import ConsultancyHighlight from "../../components/sections/ConsultancyHighlight/ConsultancyHighlight.jsx";
import ContactCTA from "../../components/sections/ContactCTA/ContactCTA.jsx";
import ContactFormSection from "../../components/sections/ContactFormSection/ContactFormSection.jsx";
import FeaturedProperties from "../../components/sections/FeaturedProperties/FeaturedProperties.jsx";
import Hero from "../../components/sections/Hero/Hero.jsx";
import PropertyManagementHighlight from "../../components/sections/PropertyManagementHighlight/PropertyManagementHighlight.jsx";
import ServicesSection from "../../components/sections/ServicesSection/ServicesSection.jsx";
import Testimonials from "../../components/sections/Testimonials/Testimonials.jsx";
import TrustIndicators from "../../components/sections/TrustIndicators/TrustIndicators.jsx";
import WhyChooseUs from "../../components/sections/WhyChooseUs/WhyChooseUs.jsx";
import SectionNavigator from "../../components/ui/SectionNavigator/SectionNavigator.jsx";
import { seoContent } from "../../content/seoContent.js";
import { homeSectionLinks } from "../../data/homeSectionLinks.js";
import { usePageMeta } from "../../hooks/usePageMeta.js";

function Home() {
  usePageMeta(seoContent.home);

  return (
    <>
      <div className="scroll-mt-24" id="home-top">
        <Hero />
      </div>
      <div className="scroll-mt-24" id="home-trust">
        <TrustIndicators />
      </div>
      <div className="scroll-mt-24" id="home-about">
        <AboutPreview />
      </div>
      <div className="scroll-mt-24" id="home-services">
        <ServicesSection limit={6} />
      </div>
      <div className="scroll-mt-24" id="home-properties">
        <FeaturedProperties />
      </div>
      <div className="scroll-mt-24" id="home-why-us">
        <WhyChooseUs />
      </div>
      <div className="scroll-mt-24" id="home-management">
        <PropertyManagementHighlight />
      </div>
      <div className="scroll-mt-24" id="home-consultancy">
        <ConsultancyHighlight />
      </div>
      <div className="scroll-mt-24" id="home-testimonials">
        <Testimonials />
      </div>
      <div className="scroll-mt-24" id="home-contact">
        <ContactCTA />
        <ContactFormSection />
      </div>
      <SectionNavigator sections={homeSectionLinks} />
    </>
  );
}

export default Home;
