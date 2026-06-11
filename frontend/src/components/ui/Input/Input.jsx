import { useId } from "react";

function Input({ label, error, className = "", id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={className}>
      {label ? (
        <label className="mb-2 block text-sm font-extrabold text-brand-forest" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className="min-h-12 w-full border border-brand-forest/15 bg-white px-4 text-brand-charcoal shadow-sm transition placeholder:text-brand-muted/70 focus:border-brand-forest/15 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
        id={inputId}
        {...props}
      />
      {error ? (
        <p className="mt-2 text-sm font-semibold text-red-700" id={`${inputId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default Input;
