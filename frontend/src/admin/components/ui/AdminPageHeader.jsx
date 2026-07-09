import { isValidElement } from "react";
import AdminButton from "./AdminButton.jsx";

function AdminPageHeader({ action, eyebrow, title, subtitle }) {
  let renderedAction = null;

  if (isValidElement(action)) {
    renderedAction = action;
  } else if (action) {
    const { label, ...actionProps } = action;
    renderedAction = <AdminButton {...actionProps}>{label}</AdminButton>;
  }

  return (
    <div className="mb-5 flex min-w-0 max-w-full flex-col gap-3 border-b border-brand-forest/10 pb-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-brand-gold">{eyebrow}</p> : null}
        <h1 className="text-2xl font-black leading-tight tracking-[0] text-brand-forest md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-3xl break-words text-sm leading-6 text-brand-muted">{subtitle}</p> : null}
      </div>
      {renderedAction}
    </div>
  );
}

export default AdminPageHeader;
