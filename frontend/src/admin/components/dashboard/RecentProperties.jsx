import { Link } from "react-router-dom";
import { adminPath } from "../../../config/adminConfig.js";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import AdminBadge from "../ui/AdminBadge.jsx";
import AdminCard from "../ui/AdminCard.jsx";

function RecentProperties({ properties }) {
  return (
    <AdminCard>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold text-brand-forest">Recent Houses & Land</h2>
        <Link className="text-sm font-extrabold text-brand-gold hover:text-brand-emerald" to={adminPath("properties")}>
          View all
        </Link>
      </div>
      <div className="grid gap-3">
        {properties.map((property) => (
          <Link
            className="flex max-w-full items-start justify-between gap-4 overflow-hidden border border-brand-forest/10 p-3 transition hover:border-brand-gold/50"
            key={property.id}
            to={adminPath(`properties/${property.id}/edit`)}
          >
            <span className="min-w-0 flex-1 max-w-full">
              <span className="block whitespace-normal break-words text-sm font-extrabold text-brand-forest">
                {property.title}
              </span>
              <span className="mt-1 block whitespace-normal break-words text-xs font-semibold text-brand-muted">
                {property.location} / {formatCurrency(property.price, property.currency)}
              </span>
            </span>
            <AdminBadge tone={property.status}>{property.status}</AdminBadge>
          </Link>
        ))}
      </div>
    </AdminCard>
  );
}

export default RecentProperties;
