import { Link } from "react-router-dom";
import { List, PlusLg } from "react-bootstrap-icons";
import { useAdminAuth } from "../../hooks/useAdminAuth.js";
import AdminButton from "../ui/AdminButton.jsx";

function AdminTopbar({ onMenuClick }) {
  const { admin } = useAdminAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-brand-forest/10 bg-white/95 px-4 py-2.5 backdrop-blur md:px-6">
      <div className="flex min-h-11 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Open admin navigation"
            className="grid h-10 w-10 place-items-center border border-brand-forest/15 text-brand-forest transition hover:bg-brand-emerald hover:!text-white focus:outline-none focus:ring-0 lg:hidden"
            onClick={onMenuClick}
            type="button"
          >
            <List aria-hidden="true" className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-brand-forest">Website Manager</p>
            <p className="hidden truncate text-xs font-semibold text-brand-muted sm:block">Update the website from here</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-extrabold uppercase tracking-[0.01em] text-brand-muted">{admin?.role || "Admin"}</p>
            <p className="text-sm font-bold text-brand-forest">{admin?.fullName || "Sureboy Admin"}</p>
          </div>
          <AdminButton icon={PlusLg} size="sm" to="/admin/properties/create">
            Add House or Land
          </AdminButton>
          <Link
            className="hidden min-h-9 items-center border border-brand-forest/15 px-3 text-xs font-extrabold uppercase text-brand-forest transition hover:bg-brand-emerald hover:!text-white md:inline-flex"
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
