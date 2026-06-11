const statusClasses = {
  available: "border-emerald-700/30 bg-emerald-50 text-emerald-900",
  "for sale": "border-emerald-700/30 bg-emerald-50 text-emerald-900",
  active: "border-emerald-700/30 bg-emerald-50 text-emerald-900",
  unread: "border-brand-gold/40 bg-brand-gold/16 text-brand-forest",
  read: "border-slate-300 bg-slate-50 text-slate-700",
  replied: "border-blue-300 bg-blue-50 text-blue-800",
  sold: "border-red-300 bg-red-50 text-red-800",
  hidden: "border-slate-300 bg-slate-100 text-slate-700",
};

function AdminBadge({ children, tone }) {
  const key = String(tone || children || "").toLowerCase();

  return (
    <span
      className={`inline-flex min-h-7 items-center border px-2.5 text-xs font-extrabold uppercase tracking-[0.01em] ${
        statusClasses[key] || "border-brand-forest/15 bg-brand-cream text-brand-forest"
      }`}
    >
      {children}
    </span>
  );
}

export default AdminBadge;
