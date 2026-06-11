import { Link, useLocation } from "react-router-dom";
import { List, PlusLg } from "react-bootstrap-icons";
import { adminNavLinks } from "../../data/adminNavLinks.js";
import { useAdminAuth } from "../../hooks/useAdminAuth.js";
import AdminButton from "../ui/AdminButton.jsx";

const getAdminTitle = (pathname) => {
  if (pathname.includes("/create")) {
    return "Create Record";
  }

  if (pathname.includes("/edit")) {
    return "Edit Record";
  }

  const match = [...adminNavLinks]
    .sort((first, second) => second.href.length - first.href.length)
    .find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`));

  return match?.label || "Admin";
};

function AdminTopbar({ onMenuClick }) {
  const { admin } = useAdminAuth();
  const location = useLocation();
  const title = getAdminTitle(location.pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-brand-gold/35 bg-white/94 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Open admin navigation"
            className="grid h-11 w-11 place-items-center border border-brand-forest/15 text-brand-forest transition hover:bg-brand-emerald hover:text-white focus:outline-none focus:ring-0 lg:hidden"
            onClick={onMenuClick}
            type="button"
          >
            <List aria-hidden="true" className="h-6 w-6" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold uppercase tracking-[0.08em] text-brand-gold">Admin Dashboard</p>
            <h2 className="truncate font-display text-2xl font-bold leading-tight text-brand-forest">{title}</h2>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-extrabold uppercase tracking-[0.01em] text-brand-muted">{admin?.role || "Admin"}</p>
            <p className="text-sm font-bold text-brand-forest">{admin?.fullName || "Sureboy Admin"}</p>
          </div>
          <AdminButton icon={PlusLg} size="sm" to="/admin/properties/create">
            Add Property
          </AdminButton>
          <Link
            className="hidden min-h-9 items-center border border-brand-forest/15 px-3 text-xs font-extrabold uppercase text-brand-forest transition hover:bg-brand-emerald hover:text-white md:inline-flex"
            to="/"
          >
            View Site
          </Link>
        </div>
      </div>
    </header>
  );
}

export default AdminTopbar;
