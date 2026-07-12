import { adminPath } from "../../config/adminConfig.js";

// The admin navigation as categorized sections. A section is either:
//   • a solo link  → has `href`, no `items` (rendered as a single row)
//   • a group      → has `items` (rendered as a collapsible heading + sub-list)
// `showAgentList` on the Agents group pulls in each staff member as a sub-link.
export const adminNavSections = [
  { id: "dashboard",  label: "Home",          href: adminPath(),             iconKey: "speedometer", roles: ["admin", "agent"] },
  { id: "properties", label: "Houses & Land", href: adminPath("properties"), iconKey: "houses",      roles: ["admin", "agent"] },

  {
    id: "team",
    label: "Our Team",
    iconKey: "people",
    roles: ["admin"],
    showTeamList: true,
    items: [
      { id: "team-all",    label: "All Members", href: adminPath("team"),        iconKey: "people" },
      { id: "team-create", label: "Add Member",  href: adminPath("team/create"), iconKey: "personCheck" },
    ],
  },

  {
    id: "access",
    label: "Website Access",
    iconKey: "shieldCheck",
    roles: ["admin"],
    items: [
      { id: "agents-all",     label: "Staff Logins", href: adminPath("agents"),         iconKey: "key" },
      { id: "agents-create",  label: "Add Login",    href: adminPath("agents/create"),  iconKey: "personCheck" },
      { id: "agent-requests", label: "Applications", href: adminPath("agent-requests"), iconKey: "clipboardCheck" },
    ],
  },

  {
    id: "customers",
    label: "Customers",
    iconKey: "personCheck",
    roles: ["admin"],
    items: [
      { id: "users",      label: "Signed-up Customers", href: adminPath("users"),      iconKey: "personCheck" },
      { id: "newsletter", label: "Email List",          href: adminPath("newsletter"), iconKey: "send" },
    ],
  },

  {
    id: "content",
    label: "Website Content",
    iconKey: "journalCheck",
    roles: ["admin"],
    items: [
      { id: "about",        label: "About Page",  href: adminPath("about"),        iconKey: "infoCircle" },
      { id: "services",     label: "What We Do",  href: adminPath("services"),     iconKey: "briefcase" },
      { id: "testimonials", label: "Reviews",     href: adminPath("testimonials"), iconKey: "stars" },
      { id: "faqs",         label: "Questions",   href: adminPath("faqs"),         iconKey: "chatDots" },
      { id: "blog",         label: "News & Tips", href: adminPath("blog"),         iconKey: "journalCheck" },
    ],
  },

  { id: "messages", label: "Messages",  href: adminPath("messages"), iconKey: "envelope", roles: ["admin", "agent"] },
  { id: "settings", label: "Site Info", href: adminPath("settings"), iconKey: "tools",    roles: ["admin"] },
];

// Backwards-compatible flat list (kept for any consumer that expects a flat array).
export const adminNavLinks = adminNavSections.flatMap((section) =>
  section.items ? section.items.map((item) => ({ ...item, roles: section.roles })) : [section],
);
