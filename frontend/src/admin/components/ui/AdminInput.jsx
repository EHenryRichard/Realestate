function AdminInput({ error, label, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className="mb-2 block text-sm font-extrabold text-brand-forest">{label}</span> : null}
      <input
        className="min-h-12 w-full border border-brand-forest/15 bg-white px-4 text-sm text-brand-charcoal placeholder:text-brand-muted/65 focus:outline-none focus:ring-0"
        {...props}
      />
      {error ? <span className="mt-2 block text-xs font-bold text-red-700">{error}</span> : null}
    </label>
  );
}

export default AdminInput;
