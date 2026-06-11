import { NavLink } from "react-router-dom";

function DesktopNav({ links }) {
  return (
    <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
      {links.map((link) => (
        <NavLink
          className={({ isActive }) =>
            [
              "px-4 py-2 text-sm font-extrabold text-brand-forest transition hover:bg-brand-cream hover:text-brand-emerald",
              isActive ? "bg-brand-cream text-brand-emerald" : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
          end={link.href === "/"}
          key={link.id}
          to={link.href}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default DesktopNav;
