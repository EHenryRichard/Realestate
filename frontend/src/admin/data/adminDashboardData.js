import { siteConfig } from "../../config/siteConfig.js";
import { propertiesData } from "../../data/propertiesData.js";
import { adminPath } from "../../config/adminConfig.js";
import { servicesData } from "../../data/servicesData.js";
import { testimonialsData } from "../../data/testimonialsData.js";

export const adminMessages = [
  {
    id: "msg-001",
    fullName: "Ada Martins",
    email: "ada@example.com",
    phone: "+234 801 234 5678",
    serviceInterestedIn: "Property Sales",
    message: "I want to inspect a family house around Lekki this week.",
    status: "unread",
    createdAt: "2026-06-08",
    updatedAt: "2026-06-08",
  },
  {
    id: "msg-002",
    fullName: "Tunde Balogun",
    email: "tunde@example.com",
    phone: "+234 809 876 5432",
    serviceInterestedIn: "Property Management",
    message: "I need help managing a rental property and tenant requests.",
    status: "read",
    createdAt: "2026-06-07",
    updatedAt: "2026-06-07",
  },
  {
    id: "msg-003",
    fullName: "Ngozi Eze",
    email: "ngozi@example.com",
    phone: "",
    serviceInterestedIn: "Investment Advisory",
    message: "Please share investment options for land and apartments.",
    status: "replied",
    createdAt: "2026-06-06",
    updatedAt: "2026-06-06",
  },
];

export const adminNewsletterSubscribers = [
  {
    id: "sub-001",
    email: "investor@example.com",
    status: "active",
    createdAt: "2026-06-01",
    updatedAt: "2026-06-01",
  },
  {
    id: "sub-002",
    email: "buyer@example.com",
    status: "active",
    createdAt: "2026-06-03",
    updatedAt: "2026-06-03",
  },
];

export const adminQuickActions = [
  {
    id: "add-property",
    label: "Add House or Land",
    href: adminPath("properties/create"),
    iconKey: "houseGear",
  },
  {
    id: "add-service",
    label: "Add Help We Offer",
    href: adminPath("services/create"),
    iconKey: "briefcase",
  },
  {
    id: "add-testimonial",
    label: "Add Customer Review",
    href: adminPath("testimonials/create"),
    iconKey: "stars",
  },
  {
    id: "view-messages",
    label: "Read Messages",
    href: adminPath("messages"),
    iconKey: "chatDots",
  },
  {
    id: "edit-settings",
    label: "Edit Phone & Address",
    href: adminPath("settings"),
    iconKey: "tools",
  },
];

export const getAdminDashboardData = () => {
  const featuredProperties = propertiesData.filter((property) => property.featured);
  const availableProperties = propertiesData.filter((property) =>
    String(property.status).toLowerCase().includes("sale"),
  );
  const soldProperties = propertiesData.filter((property) => String(property.status).toLowerCase() === "sold");
  const unreadMessages = adminMessages.filter((message) => message.status === "unread");

  return {
    stats: [
      {
        id: "total-properties",
        label: "All Houses & Land",
        value: propertiesData.length,
        helper: "Everything listed on the site",
        iconKey: "houses",
      },
      {
        id: "featured-properties",
        label: "Shown First",
        value: featuredProperties.length,
        helper: "Shown on the home page",
        iconKey: "star",
      },
      {
        id: "available-properties",
        label: "Available",
        value: availableProperties.length,
        helper: "People can ask about these",
        iconKey: "houseCheck",
      },
      {
        id: "sold-properties",
        label: "Sold",
        value: soldProperties.length,
        helper: "No longer available",
        iconKey: "patchCheck",
      },
      {
        id: "total-services",
        label: "Help We Offer",
        value: servicesData.length,
        helper: "What visitors can request",
        iconKey: "briefcase",
      },
      {
        id: "total-testimonials",
        label: "Customer Reviews",
        value: testimonialsData.length,
        helper: "What customers said",
        iconKey: "stars",
      },
      {
        id: "unread-messages",
        label: "New Messages",
        value: unreadMessages.length,
        helper: "Read these first",
        iconKey: "chatDots",
      },
      {
        id: "subscribers",
        label: "Email List",
        value: adminNewsletterSubscribers.length,
        helper: "People waiting for updates",
        iconKey: "envelope",
      },
    ],
    recentProperties: propertiesData.slice(0, 4),
    recentMessages: adminMessages.slice(0, 4),
    quickActions: adminQuickActions,
    settings: siteConfig,
  };
};
