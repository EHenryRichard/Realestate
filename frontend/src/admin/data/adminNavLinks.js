import { adminPath } from "../../config/adminConfig.js";

export const adminNavLinks = [
  { id: "dashboard",    label: "Home",         href: adminPath(),                 iconKey: "speedometer",  helper: "Today at a glance", roles: ["admin", "agent"] },
  { id: "properties",   label: "Houses & Land", href: adminPath("properties"),    iconKey: "houses",       helper: "Add or edit listings", roles: ["admin", "agent"] },
  { id: "agents",       label: "Staff",        href: adminPath("agents"),         iconKey: "people",       helper: "People with admin access", roles: ["admin"] },
  { id: "users",        label: "Customers",    href: adminPath("users"),          iconKey: "personCheck",  helper: "People who signed up", roles: ["admin"] },
  { id: "agent-requests", label: "Agent Forms", href: adminPath("agent-requests"), iconKey: "clipboardCheck", helper: "People asking to join", roles: ["admin"] },
  { id: "services",     label: "What We Do",   href: adminPath("services"),       iconKey: "briefcase",    helper: "Services on the website", roles: ["admin"] },
  { id: "testimonials", label: "Reviews",      href: adminPath("testimonials"),   iconKey: "stars",        helper: "Customer comments", roles: ["admin"] },
  { id: "faqs",         label: "Questions",    href: adminPath("faqs"),           iconKey: "chatDots",     helper: "Common answers", roles: ["admin"] },
  { id: "blog",         label: "News & Tips",  href: adminPath("blog"),           iconKey: "journalCheck", helper: "Posts for visitors", roles: ["admin"] },
  { id: "messages",     label: "Messages",     href: adminPath("messages"),       iconKey: "envelope",     helper: "People asking for help", roles: ["admin", "agent"] },
  { id: "newsletter",   label: "Email List",   href: adminPath("newsletter"),     iconKey: "send",         helper: "People waiting for updates", roles: ["admin"] },
  { id: "settings",     label: "Site Info",    href: adminPath("settings"),       iconKey: "tools",        helper: "Phone, email, address", roles: ["admin"] },
];
