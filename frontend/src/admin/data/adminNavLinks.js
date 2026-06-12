import { adminPath } from "../../config/adminConfig.js";

export const adminNavLinks = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: adminPath(),
    iconKey: "speedometer",
    helper: "Overview",
  },
  {
    id: "properties",
    label: "Properties",
    href: adminPath("properties"),
    iconKey: "houses",
    helper: "Listings",
  },
  {
    id: "agents",
    label: "Agents",
    href: adminPath("agents"),
    iconKey: "people",
    helper: "Team access",
  },
  {
    id: "services",
    label: "Services",
    href: adminPath("services"),
    iconKey: "briefcase",
    helper: "Offerings",
  },
  {
    id: "testimonials",
    label: "Testimonials",
    href: adminPath("testimonials"),
    iconKey: "stars",
    helper: "Client proof",
  },
  {
    id: "messages",
    label: "Messages",
    href: adminPath("messages"),
    iconKey: "chatDots",
    helper: "Enquiries",
  },
  {
    id: "newsletter",
    label: "Newsletter",
    href: adminPath("newsletter"),
    iconKey: "envelope",
    helper: "Subscribers",
  },
  {
    id: "settings",
    label: "Settings",
    href: adminPath("settings"),
    iconKey: "tools",
    helper: "Site details",
  },
];
