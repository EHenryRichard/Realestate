import { Link } from "react-router-dom";
import AdminBadge from "../ui/AdminBadge.jsx";
import AdminCard from "../ui/AdminCard.jsx";

function RecentMessages({ messages }) {
  return (
    <AdminCard>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold text-brand-forest">Recent Messages</h2>
        <Link className="text-sm font-extrabold text-brand-gold hover:text-brand-emerald" to="/admin/messages">
          View all
        </Link>
      </div>
      <div className="grid gap-3">
        {messages.map((message) => (
          <Link
            className="border border-brand-forest/10 p-3 transition hover:border-brand-gold/50"
            key={message.id}
            to={`/admin/messages/${message.id}`}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold text-brand-forest">{message.fullName}</span>
                <span className="mt-1 block truncate text-xs font-semibold text-brand-muted">
                  {message.serviceInterestedIn}
                </span>
              </span>
              <AdminBadge tone={message.status}>{message.status}</AdminBadge>
            </span>
          </Link>
        ))}
      </div>
    </AdminCard>
  );
}

export default RecentMessages;
