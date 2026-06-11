function SectionLoader({ label = "Loading content" }) {
  return (
    <div className="grid min-h-40 place-items-center border border-brand-forest/10 bg-brand-cream/40 p-6">
      <div className="flex items-center gap-3 text-sm font-extrabold text-brand-forest">
        <span className="loader-ring h-7 w-7 border-2" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export default SectionLoader;
