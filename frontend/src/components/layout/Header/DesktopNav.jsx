import { NavLink } from "react-router-dom";

function DesktopNav({ links }) {
  return (
    <nav aria-label="Primary navigation" className="hidden min-w-0 items-center justify-center gap-1 lg:flex">
      {links.map((link) => (
        <NavLink
          className={({ isActive }) =>
            [
              "relative flex min-h-10 items-center px-3 text-xs font-extrabold uppercase tracking-[0.01em] text-white/76 transition hover:bg-white/8 hover:text-white xl:px-4",
              isActive ? "bg-white/10 text-brand-gold" : "",
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
