export const siteConfig = {
  brandName: "Sureboy Realty",
  tagline: "Premium Properties. Prime Investments. Promises Delivered.",
  slogans: ["Your Property. Our Priority.", "Built on Trust. Driven by Excellence."],
  phone: "+234 916 326 7765",
  phoneCompact: "+2349163267765",
  email: "austineokolie57@gmail.com",
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
      href: "https://www.instagram.com/",
      iconKey: "instagram",
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/",
      iconKey: "facebook",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/",
      iconKey: "linkedin",
    },
    {
      label: "X",
      href: "https://x.com/",
      iconKey: "twitterX",
    },
  ],
};

export const getSiteWhatsAppLink = (message = "Hello Sureboy Realty, I would like to speak with an agent.") =>
  `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
