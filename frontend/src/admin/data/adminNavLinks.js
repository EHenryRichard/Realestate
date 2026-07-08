import { adminPath } from "../../config/adminConfig.js";

export const adminNavLinks = [
  { id: "dashboard",    label: "Dashboard",    href: adminPath(),                 iconKey: "speedometer",  helper: "Overview",     roles: ["admin", "agent"] },
  { id: "properties",   label: "Properties",   href: adminPath("properties"),     iconKey: "houses",       helper: "Listings",     roles: ["admin", "agent"] },
  { id: "agents",       label: "Team",         href: adminPath("agents"),         iconKey: "people",       helper: "Manage users", roles: ["admin"] },
  { id: "users",        label: "Users",        href: adminPath("users"),          iconKey: "personCheck",  helper: "Client accounts", roles: ["admin"] },
  { id: "services",     label: "Services",     href: adminPath("services"),       iconKey: "briefcase",    helper: "Offerings",    roles: ["admin"] },
  { id: "testimonials", label: "Testimonials", href: adminPath("testimonials"),   iconKey: "stars",        helper: "Client proof", roles: ["admin"] },
  { id: "faqs",         label: "FAQs",         href: adminPath("faqs"),           iconKey: "chatDots",     helper: "Q&A",          roles: ["admin"] },
  { id: "blog",         label: "Blog",         href: adminPath("blog"),           iconKey: "journalCheck", helper: "Articles",     roles: ["admin"] },
  { id: "messages",     label: "Messages",     href: adminPath("messages"),       iconKey: "envelope",     helper: "Enquiries",    roles: ["admin", "agent"] },
  { id: "newsletter",   label: "Newsletter",   href: adminPath("newsletter"),     iconKey: "send",         helper: "Subscribers",  roles: ["admin"] },
  { id: "settings",     label: "Settings",     href: adminPath("settings"),       iconKey: "tools",        helper: "Site details", roles: ["admin"] },
];
