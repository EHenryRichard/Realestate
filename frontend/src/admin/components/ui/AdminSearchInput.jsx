import { Search } from "react-bootstrap-icons";

function AdminSearchInput({ className = "", label = "Search", ...props }) {
  return (
    <label className={`relative block min-w-0 max-w-full ${className}`}>
      <span className="sr-only">{label}</span>
      <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gold" />
      <input
        className="min-h-12 min-w-0 w-full border border-brand-forest/15 bg-white px-10 text-sm text-brand-charcoal placeholder:text-brand-muted/65 focus:outline-none focus:ring-0"
        placeholder={label}
        type="search"
        {...props}
      />
    </label>
  );
}

export default AdminSearchInput;
