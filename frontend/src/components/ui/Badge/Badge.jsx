const toneClasses = {
  gold: "bg-brand-gold text-brand-charcoal",
  green: "bg-brand-forest text-white",
  cream: "bg-brand-cream text-brand-forest",
  muted: "bg-slate-100 text-brand-muted",
};

function Badge({ children, tone = "gold", className = "" }) {
  return (
    <span className={`inline-flex min-h-8 items-center px-3 text-xs font-extrabold uppercase tracking-[0.12em] ${toneClasses[tone] || toneClasses.gold} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
