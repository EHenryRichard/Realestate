function AdminTextarea({ error, label, className = "", ...props }) {
  return (
    <label className={`block min-w-0 w-full max-w-full ${className}`}>
      {label ? <span className="mb-2 block text-sm font-extrabold text-brand-forest">{label}</span> : null}
      <textarea
        className="box-border min-h-32 min-w-0 w-full max-w-full resize-y border border-brand-forest/15 bg-white px-4 py-3 text-sm text-brand-charcoal placeholder:text-brand-muted/65 focus:outline-none focus:ring-0"
        {...props}
      />
      {error ? <span className="mt-2 block text-xs font-bold text-red-700">{error}</span> : null}
    </label>
  );
}

export default AdminTextarea;
