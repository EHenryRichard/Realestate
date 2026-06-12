import AdminButton from "./AdminButton.jsx";

function AdminPageHeader({ action, eyebrow = "Sureboy Admin", title, subtitle }) {
  return (
    <div className="mb-5 flex min-w-0 max-w-full flex-col gap-4 border-b border-brand-forest/10 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-brand-gold">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-brand-forest md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-brand-muted">{subtitle}</p> : null}
      </div>
      {action ? <AdminButton {...action}>{action.label}</AdminButton> : null}
    </div>
  );
}

export default AdminPageHeader;
