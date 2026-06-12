import { Link } from "react-router-dom";
import { adminPath } from "../../../config/adminConfig.js";

const variantClasses = {
  primary: "border border-brand-gold bg-brand-gold text-brand-forest hover:bg-brand-emerald hover:text-white",
  dark: "border border-brand-forest bg-brand-forest text-white hover:bg-brand-emerald hover:text-white",
  outline: "border border-brand-gold/60 text-brand-gold hover:bg-brand-emerald hover:text-white",
  ghost: "text-brand-forest hover:bg-brand-emerald hover:text-white",
  danger: "border border-red-800 bg-red-800 text-white hover:bg-brand-emerald hover:text-white",
};

const sizeClasses = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-sm",
};

function AdminButton({
  children,
  className = "",
  disabled = false,
  href,
  icon: Icon,
  size = "md",
  to,
  type = "button",
  variant = "primary",
  ...props
}) {
  const classes = [
    "inline-flex items-center justify-center gap-2 font-extrabold uppercase tracking-[0.01em] transition focus:outline-none focus:ring-0",
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    disabled ? "pointer-events-none opacity-60" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      {Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : null}
      <span>{children}</span>
    </>
  );

  if (to) {
    const linkTarget = typeof to === "string" && to.startsWith("/admin") ? adminPath(to) : to;

    return (
      <Link className={classes} to={linkTarget} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a className={classes} href={href} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button className={classes} disabled={disabled} type={type} {...props}>
      {content}
    </button>
  );
}

export default AdminButton;
