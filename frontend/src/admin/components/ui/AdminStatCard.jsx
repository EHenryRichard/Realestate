import { getIcon } from "../../../config/iconConfig.js";

function AdminStatCard({ helper, iconKey, label, value }) {
  const Icon = getIcon(iconKey);

  return (
    <article className="border border-brand-forest/10 bg-white p-4 shadow-[0_14px_40px_rgba(6,63,44,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.01em] text-brand-muted">{label}</p>
          <p className="mt-3 font-display text-3xl font-bold leading-none text-brand-forest">{value}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center border border-brand-gold/35 bg-brand-cream text-brand-gold">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
      {helper ? <p className="mt-4 text-xs font-semibold text-brand-muted">{helper}</p> : null}
    </article>
  );
}

export default AdminStatCard;
