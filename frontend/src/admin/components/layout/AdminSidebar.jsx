import { NavLink, useNavigate } from "react-router-dom";
import { BoxArrowRight, PersonCircle } from "react-bootstrap-icons";
import { getIcon } from "../../../config/iconConfig.js";
import { siteConfig } from "../../../config/siteConfig.js";
import { adminConfig, adminPath } from "../../../config/adminConfig.js";
import { adminNavLinks } from "../../data/adminNavLinks.js";
import { useAdminAuth } from "../../hooks/useAdminAuth.js";

function AdminSidebar({ onNavigate }) {
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const role = admin?.role || "agent";

  const visibleLinks = adminNavLinks.filter(
    (link) => !link.roles || link.roles.includes(role)
  );

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate(adminPath("login"), { replace: true });
  };

  return (
    <aside className="flex h-full flex-col border-r border-white/10 bg-brand-forest text-white">
      {/* Brand */}
      <div className="border-b border-white/10 px-5 py-5">
        <img
          alt={siteConfig.brandName}
          className="h-10 w-auto object-contain brightness-0 invert"
          src="/images/logo/logo.png"
        />
        <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.08em] text-brand-gold">
          Admin Panel
        </p>
      </div>

      {/* Nav */}
      <nav aria-label="Admin navigation" className="grid gap-1 overflow-y-auto px-3 py-4">
        {visibleLinks.map((link) => {
          const Icon = getIcon(link.iconKey);
          return (
            <NavLink
              className={({ isActive }) =>
                [
                  "group flex min-h-14 items-center gap-3 px-2 text-sm transition hover:-translate-x-1 hover:bg-white/6 hover:text-white",
                  isActive ? "bg-white/8 text-white" : "text-white/78",
                ].join(" ")
              }
              end={link.href === adminConfig.basePath}
              key={link.id}
              onClick={onNavigate}
              to={link.href}
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={`h-9 w-1 bg-white transition ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  />
                  <span
                    className={`grid h-10 w-10 place-items-center transition ${isActive ? "text-white" : "text-white/64 group-hover:text-white"}`}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-extrabold uppercase leading-tight tracking-[0.01em]">{link.label}</span>
                    {link.helper ? <span className="mt-1 block text-xs text-white/54">{link.helper}</span> : null}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: profile + logout */}
      <div className="mt-auto border-t border-white/10 p-3 grid gap-1">
        <NavLink
          className={({ isActive }) =>
            [
              "group flex min-h-12 items-center gap-3 px-3 text-sm font-extrabold uppercase tracking-[0.01em] transition hover:bg-white/6 hover:text-white",
              isActive ? "bg-white/8 text-white" : "text-white/78",
            ].join(" ")
          }
          onClick={onNavigate}
          to={adminPath("profile")}
        >
          <PersonCircle aria-hidden="true" className="h-5 w-5 text-white/64 transition group-hover:text-white" />
          <span className="min-w-0">
            <span className="block truncate">{admin?.fullName || "My Profile"}</span>
            <span className="block text-xs font-normal normal-case text-white/50">{role}</span>
          </span>
        </NavLink>
        <button
          className="flex min-h-12 w-full items-center gap-3 px-3 text-sm font-extrabold uppercase tracking-[0.01em] text-white/78 transition hover:bg-brand-emerald hover:text-white focus:outline-none focus:ring-0"
          onClick={handleLogout}
          type="button"
        >
          <BoxArrowRight aria-hidden="true" className="h-5 w-5 text-white/64" />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
