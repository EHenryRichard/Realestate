export const siteConfig = {
  brandName: "Sureboy Realty",
  tagline: "Premium Properties. Prime Investments. Promises Delivered.",
  slogans: ["Your Property. Our Priority.", "Built on Trust. Driven by Excellence."],
  phone: "+234 916 326 7765",
  phoneCompact: "+2349163267765",
  email: "Sureboyrealty@gmail.com",
  whatsappNumber: "2349163267765",
  address: "Warri, Delta State, Nigeria",
  businessHours: "Mon - Sat, 9:00 AM - 6:00 PM",
  cta: {
    label: "Speak With an Agent",
    href: "/contact",
  },
  socialLinks: [
    {
      label: "Instagram",
      href: "https://www.instagram.com/Sureboy_Realty",
      iconKey: "instagram",
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/Sureboy_Realty",
      iconKey: "facebook",
    },
    {
      label: "TikTok",
      href: "https://www.tiktok.com/@sureboy_Realty",
      iconKey: "tiktok",
    },
    {
      label: "Telegram",
      href: "https://t.me/Sureboy_Realty",
      iconKey: "telegram",
    },
  ],
};

export const getSiteWhatsAppLink = (message = "Hello Sureboy Realty, I would like to speak with an agent.") =>
  `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
