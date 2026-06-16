import { Whatsapp } from "react-bootstrap-icons";
import { getSiteWhatsAppLink } from "../../../config/siteConfig.js";

function WhatsAppButton() {
  const href = getSiteWhatsAppLink("Hello Sureboy Realty, I would like to enquire about a property.");

  return (
    <a
      aria-label="Chat with Sureboy Realty on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Whatsapp aria-hidden="true" className="h-7 w-7 text-white" />
    </a>
  );
}

export default WhatsAppButton;
