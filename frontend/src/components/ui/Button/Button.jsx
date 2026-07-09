import { Link } from "react-router-dom";

const variantClasses = {
  primary:
    "brand-sheen border border-brand-gold bg-brand-emerald !text-white shadow-[0_16px_34px_rgba(6,63,44,0.24)] hover:bg-brand-forest hover:!text-white",
  secondary: "bg-white text-brand-forest hover:bg-brand-cream",
  outline:
    "border border-brand-gold/70 text-brand-gold hover:border-brand-emerald hover:bg-brand-emerald hover:!text-white",
  dark: "bg-brand-forest !text-white hover:bg-brand-emerald hover:!text-white",
  ghost: "text-brand-forest hover:bg-brand-cream",
};

const sizeClasses = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-3.5 text-base",
};

function Button({
  children,
  className = "",
  href,
  to,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "right",
  disabled = false,
  type = "button",
  ...props
}) {
  const classes = [
    "inline-flex min-h-11 items-center justify-center gap-2 font-extrabold tracking-[0] transition duration-200 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    disabled ? "pointer-events-none opacity-60" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const forceLightText = variant === "primary" || variant === "dark";
  const contentClass = forceLightText ? "relative z-10 !text-white text-white" : "relative z-10";
  const iconClass = `h-4 w-4 ${forceLightText ? "!text-white text-white" : ""}`.trim();

  const content = (
    <>
      {Icon && iconPosition === "left" ? <Icon aria-hidden="true" className={iconClass} /> : null}
      <span className={contentClass}>{children}</span>
      {Icon && iconPosition === "right" ? <Icon aria-hidden="true" className={iconClass} /> : null}
    </>
  );

  if (to) {
    return (
      <Link className={classes} to={to} {...props}>
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

export default Button;
