function SectionHeader({ eyebrow, title, subtitle, align = "left", className = "", tone = "light" }) {
  const isCenter = align === "center";
  const isDark = tone === "dark";

  return (
    <div className={`${isCenter ? "mx-auto text-center" : ""} max-w-3xl ${className}`}>
      {eyebrow ? (
        <p className={`mb-3 text-sm font-extrabold uppercase tracking-[0.16em] ${isDark ? "text-brand-gold-soft" : "text-brand-gold"}`}>
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2 className={`text-balance text-3xl font-black tracking-[0] sm:text-4xl ${isDark ? "text-white" : "text-brand-forest"}`}>
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <p className={`mt-4 text-base leading-7 ${isDark ? "text-white/78" : "text-brand-muted"}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export default SectionHeader;
