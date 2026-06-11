import { NavLink, useNavigate } from "react-router-dom";
import { BoxArrowRight } from "react-bootstrap-icons";
import { getIcon } from "../../../config/iconConfig.js";
import { siteConfig } from "../../../config/siteConfig.js";
import { adminNavLinks } from "../../data/adminNavLinks.js";
import { useAdminAuth } from "../../hooks/useAdminAuth.js";

function AdminSidebar({ onNavigate }) {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="flex h-full flex-col border-r border-white/10 bg-brand-forest text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="font-display text-3xl font-bold leading-none text-white">{siteConfig.brandName}</p>
        <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.08em] text-brand-gold">Admin Control</p>
      </div>

      <nav aria-label="Admin navigation" className="grid gap-1 px-3 py-4">
        {adminNavLinks.map((link) => {
          const Icon = getIcon(link.iconKey);

          return (
            <NavLink
              className={({ isActive }) =>
                [
                  "group flex min-h-14 items-center gap-3 px-2 text-sm transition hover:-translate-x-1 hover:bg-white/6 hover:text-brand-gold",
                  isActive ? "bg-white/8 text-brand-gold" : "text-white/82",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
              end={link.href === "/admin"}
              key={link.id}
              onClick={onNavigate}
              to={link.href}
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={`h-9 w-1 bg-brand-gold transition ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  />
                  <span className="grid h-10 w-10 place-items-center border border-brand-gold/25 text-brand-gold">
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

      <div className="mt-auto border-t border-white/10 p-3">
        <button
          className="flex min-h-12 w-full items-center gap-3 px-3 text-sm font-extrabold uppercase tracking-[0.01em] text-white/78 transition hover:bg-brand-emerald hover:text-white focus:outline-none focus:ring-0"
          onClick={handleLogout}
          type="button"
        >
          <BoxArrowRight aria-hidden="true" className="h-5 w-5 text-brand-gold" />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
