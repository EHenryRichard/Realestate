import { siteConfig } from "../config/siteConfig.js";

export const getWhatsAppLink = (
  message = "Hello Sureboy Realty, I would like to speak with an agent.",
) => `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
