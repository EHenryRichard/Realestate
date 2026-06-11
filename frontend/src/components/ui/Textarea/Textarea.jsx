import { useId } from "react";

function Textarea({ label, error, className = "", id, ...props }) {
  const generatedId = useId();
  const textareaId = id || generatedId;

  return (
    <div className={className}>
      {label ? (
        <label className="mb-2 block text-sm font-extrabold text-brand-forest" htmlFor={textareaId}>
          {label}
        </label>
      ) : null}
      <textarea
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        className="min-h-36 w-full resize-y border border-brand-forest/15 bg-white px-4 py-3 text-brand-charcoal shadow-sm transition placeholder:text-brand-muted/70 focus:border-brand-forest/15 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
        id={textareaId}
        {...props}
      />
      {error ? (
        <p className="mt-2 text-sm font-semibold text-red-700" id={`${textareaId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default Textarea;
